const Subscription = require("../../models/Subscription");
const { ApiResponse } = require("../../helpers");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.name,
              description: plan.subtitle || plan.description || "Monthly subscription",
            },
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
