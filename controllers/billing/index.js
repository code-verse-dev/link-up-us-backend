const Subscription = require("../../models/Subscription");
const User = require("../../models/User");
const Referral = require("../../models/Referral");
const { ApiResponse, generateToken, generateMemberId } = require("../../helpers");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/** GET /api/billing/config — public; returns Stripe publishable key for client-side Stripe.js */
exports.getConfig = async (req, res) => {
  const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || "";
  return res.json(ApiResponse({ stripePublishableKey }, "OK", true));
};
const PendingSignup = require("../../models/PendingSignup");
const Cluster = require("../../models/Cluster");
const Plan = require("../../models/Plan");
const bcrypt = require("bcryptjs");

exports.createCheckoutSession = async (req, res) => {
  try {
    const {
      clusterId,
      email,
      password,
      businessName,
      contactName,
      databaseSize,
      referralCode,
    } = req.body || {};
    if (!clusterId || !email || !password || !businessName || !contactName) {
      return res
        .status(400)
        .json(
          ApiResponse(
            {},
            "clusterId, email, password, businessName, contactName required",
            false
          )
        );
    }
    const cluster = await Cluster.findById(clusterId);
    if (!cluster || !cluster.active) {
      return res.status(400).json(ApiResponse({}, "Invalid or inactive cluster", false));
    }
    const existingUser = await require("../../models/User").findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
      return res.status(409).json(ApiResponse({}, "Email already registered", false));
    }
    const signupId =
      require("crypto").randomUUID?.() ||
      `signup_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    await PendingSignup.create({
      signupId,
      clusterId,
      email: email.toLowerCase(),
      hashedPassword,
      businessName,
      contactName,
      databaseSize: databaseSize ?? 0,
      referralCode: referralCode && referralCode.trim() ? referralCode.trim() : "NONE",
    });
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const successUrl = `${frontendUrl}/join/success?signup_id=${signupId}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}/join`;

    let plan = await Plan.findOne({ active: true }).sort({ createdAt: 1 });
    if (!plan) plan = await Plan.findOne({}).sort({ createdAt: 1 });
    if (!plan) {
      return res.status(500).json(ApiResponse({}, "No subscription plan configured", false));
    }

    const planProduct = await stripe.products.create({
      name: plan.name,
      description: (plan.subtitle || plan.description || "Monthly subscription").slice(0, 500),
    });
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product: planProduct.id,
            unit_amount: plan.priceCents,
            recurring: { interval: plan.interval || "month" },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email,
      metadata: { signupId },
    });

    return res.json(
      ApiResponse({ url: session.url }, "Checkout session created", true)
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json(ApiResponse({}, err.message || "Checkout failed", false));
  }
};

/** POST /api/billing/create-subscription — create customer, subscription, user (inline payment flow). */
exports.createSubscription = async (req, res) => {
  try {
    const {
      clusterId,
      email,
      password,
      businessName,
      contactName,
      databaseSize,
      referralCode,
      paymentMethodId,
    } = req.body || {};
    if (!clusterId || !email || !password || !businessName || !contactName || !paymentMethodId) {
      return res
        .status(400)
        .json(
          ApiResponse(
            {},
            "clusterId, email, password, businessName, contactName, paymentMethodId required",
            false
          )
        );
    }
    const cluster = await Cluster.findById(clusterId);
    if (!cluster || !cluster.active) {
      return res.status(400).json(ApiResponse({}, "Invalid or inactive cluster", false));
    }
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json(ApiResponse({}, "Email already registered", false));
    }
    let plan = await Plan.findOne({ active: true }).sort({ createdAt: 1 });
    if (!plan) plan = await Plan.findOne({}).sort({ createdAt: 1 });
    if (!plan) {
      return res.status(500).json(ApiResponse({}, "No subscription plan configured", false));
    }

    const customer = await stripe.customers.create({
      email: email.toLowerCase(),
      name: contactName,
      metadata: { businessName },
    });
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const priceCents = plan.priceCents;
    const interval = plan.interval || "month";
    const product = await stripe.products.create({
      name: plan.name,
      description: (plan.subtitle || plan.description || "").slice(0, 500),
    });
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price_data: {
            currency: "usd",
            product: product.id,
            unit_amount: priceCents,
            recurring: { interval: interval === "year" ? "year" : "month" },
          },
        },
      ],
      default_payment_method: paymentMethodId,
      expand: ["latest_invoice.payment_intent"],
    });

    const memberId = await generateMemberId(User);
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: contactName,
      businessName,
      industry: "General",
      region: cluster.name,
      clusterId: cluster._id,
      status: "active",
      referralCode: referralCode && referralCode.trim() ? referralCode.trim() : "NONE",
      databaseSize: databaseSize ?? 0,
      residualEarnings: 0,
      memberId,
      stripeCustomerId: customer.id,
    });
    await user.save();

    await Subscription.create({
      userId: user._id,
      planId: plan._id,
      status: "active",
      currentPeriodEnd: stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000)
        : undefined,
      referralDiscountApplied: false,
      stripeSubscriptionId: stripeSubscription.id,
    });

    if (referralCode && referralCode.trim() && referralCode.trim() !== "NONE") {
      const referrer = await User.findOne({
        $or: [
          { memberId: { $regex: new RegExp(`^${referralCode.trim()}$`, "i") } },
          { referralCode: referralCode.trim() },
        ],
        status: "active",
      });
      if (referrer) {
        await Referral.create({
          referrerUserId: referrer._id,
          referrerMemberId: referrer.memberId,
          businessName,
          region: cluster.name,
          status: "Active",
          discountAmount: "$4.99",
          earningsPerMonth: "$5.00/mo",
        });
      }
    }

    const token = generateToken(user);
    const u = user.toObject();
    delete u.password;
    return res.status(201).json(ApiResponse({ user: u, token }, "Subscription created", true));
  } catch (err) {
    console.error(err);
    return res.status(500).json(ApiResponse({}, err.message || "Create subscription failed", false));
  }
};

exports.getSubscription = async (req, res) => {
  try {
    const userId = req.user?._id || req.headers["x-user-id"] || req.query?.userId;
    if (!userId) {
      return res.status(401).json(ApiResponse({}, "Unauthorized", false));
    }
    const sub = await Subscription.findOne({ userId })
      .populate("planId")
      .sort({ createdAt: -1 })
      .lean();
    if (!sub) {
      return res.json(
        ApiResponse(
          {
            subscribed: false,
            message: "No active subscription.",
          },
          "OK",
          true
        )
      );
    }
    return res.json(
      ApiResponse(
        {
          subscribed: true,
          planId: sub.planId?._id || sub.planId,
          status: sub.status,
          currentPeriodEnd: sub.currentPeriodEnd,
          referralDiscountApplied: sub.referralDiscountApplied,
        },
        "OK",
        true
      )
    );
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** GET /api/billing/payment-method — returns current user's default payment method (auth). */
exports.getPaymentMethod = async (req, res) => {
  try {
    const userId = req.user?._id || req.headers["x-user-id"] || req.query?.userId;
    if (!userId) {
      return res.status(401).json(ApiResponse({}, "Unauthorized", false));
    }
    // Placeholder: no stripeCustomerId stored on User yet; return empty until wired to Stripe
    return res.json(
      ApiResponse(
        { paymentMethod: null, message: "No payment method on file." },
        "OK",
        true
      )
    );
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** GET /api/billing/summary — returns billing summary for current user (auth). */
exports.getBillingSummary = async (req, res) => {
  try {
    const userId = req.user?._id || req.headers["x-user-id"] || req.query?.userId;
    if (!userId) {
      return res.status(401).json(ApiResponse({}, "Unauthorized", false));
    }
    const sub = await Subscription.findOne({ userId })
      .populate("planId")
      .sort({ createdAt: -1 })
      .lean();
    const summary = {
      subscribed: !!sub,
      plan: sub?.planId ? { id: sub.planId._id, name: sub.planId.name } : null,
      status: sub?.status || null,
      currentPeriodEnd: sub?.currentPeriodEnd || null,
    };
    return res.json(ApiResponse(summary, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** POST /api/billing/subscription/cancel — member cancels own subscription (at period end). */
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user?._id || req.headers["x-user-id"] || req.query?.userId;
    if (!userId) {
      return res.status(401).json(ApiResponse({}, "Unauthorized", false));
    }
    const sub = await Subscription.findOne({ userId }).sort({ createdAt: -1 });
    if (!sub) {
      return res.json(ApiResponse({ cancelAtPeriodEnd: false, message: "No subscription found." }, "OK", true));
    }
    if (sub.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
      } catch (e) {
        if (e.code !== "resource_missing") throw e;
      }
    }
    sub.cancelAtPeriodEnd = true;
    await sub.save();
    return res.json(ApiResponse({ cancelAtPeriodEnd: true, currentPeriodEnd: sub.currentPeriodEnd }, "Cancel at period end set", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.listInvoices = async (req, res) => {
  try {
    const userId = req.user?._id || req.headers["x-user-id"] || req.query?.userId;
    if (!userId) {
      return res.status(401).json(ApiResponse({}, "Unauthorized", false));
    }
    return res.json(
      ApiResponse(
        { invoices: [], message: "Stripe integration pending." },
        "OK",
        true
      )
    );
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
