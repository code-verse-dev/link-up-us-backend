const User = require("../../models/User");
const Cluster = require("../../models/Cluster");
const PendingSignup = require("../../models/PendingSignup");
const Referral = require("../../models/Referral");
const Subscription = require("../../models/Subscription");
const Plan = require("../../models/Plan");
const { ApiResponse, generateToken, generateMemberId } = require("../../helpers");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json(ApiResponse({}, "Email and password required", false));
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        const token = generateToken(user);
        const u = user.toObject();
        delete u.password;
        return res.json(ApiResponse({ user: u, token }, "Logged in", true));
      }
    }
    return res.status(401).json(ApiResponse({}, "Invalid credentials", false));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** POST /api/auth/forgot-password — member: send reset link (or return link in dev) */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !String(email).trim()) {
      return res.status(400).json(ApiResponse({}, "Email required", false));
    }
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.json(ApiResponse({ message: "If that email exists, a reset link was sent." }, "OK", true));
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const resetLink = `${baseUrl}/link-up-us/reset-password?token=${resetToken}`;
    if (process.env.NODE_ENV !== "production") {
      return res.json(ApiResponse({ resetLink, message: "Use this link to reset (dev only)." }, "OK", true));
    }
    return res.json(ApiResponse({ message: "If that email exists, a reset link was sent." }, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** POST /api/auth/reset-password — member: set new password using token */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json(ApiResponse({}, "Valid token and new password (min 6 characters) required", false));
    }
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json(ApiResponse({}, "Invalid or expired reset token", false));
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();
    return res.json(ApiResponse({}, "Password reset. You can log in.", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      region,
      clusterId,
      businessName,
      industry,
      contactName,
      referralCode,
      databaseSize,
      partnerBannerUrl,
    } = req.body || {};
    if (!email || !password || !businessName || !contactName) {
      return res
        .status(400)
        .json(ApiResponse({}, "email, password, businessName, contactName required", false));
    }
    let regionName = region;
    let clusterObjId = null;
    if (clusterId) {
      const cluster = await Cluster.findById(clusterId);
      if (!cluster || !cluster.active) {
        return res.status(400).json(ApiResponse({}, "Invalid or inactive cluster", false));
      }
      regionName = cluster.name;
      clusterObjId = cluster._id;
    } else if (region && typeof region === "string") {
      const cluster = await Cluster.findOne({ name: region.trim(), active: true });
      if (cluster) {
        clusterObjId = cluster._id;
        regionName = cluster.name;
      }
    }
    if (!regionName) {
      return res.status(400).json(ApiResponse({}, "region or clusterId is required", false));
    }
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json(ApiResponse({}, "Email already registered", false));
    }
    const memberId = await generateMemberId(User);
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      email: email.toLowerCase(),
      password: hashed,
      name: contactName,
      businessName,
      industry: industry || "General",
      region: regionName,
      clusterId: clusterObjId,
      status: "active",
      referralCode: referralCode || "NONE",
      databaseSize: databaseSize ?? 0,
      residualEarnings: 0,
      memberId,
      partnerBannerUrl: partnerBannerUrl || undefined,
    });
    await user.save();
    const token = generateToken(user);
    const u = user.toObject();
    delete u.password;
    return res.status(201).json(ApiResponse({ user: u, token }, "Registered", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.completeSignup = async (req, res) => {
  try {
    const { signupId, sessionId } = req.body || {};
    if (!signupId || !sessionId) {
      return res
        .status(400)
        .json(ApiResponse({}, "signupId and sessionId required", false));
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
    if (session.payment_status !== "paid") {
      return res.status(400).json(ApiResponse({}, "Payment not completed", false));
    }
    if (session.metadata?.signupId !== signupId) {
      return res.status(400).json(ApiResponse({}, "Invalid session", false));
    }
    const pending = await PendingSignup.findOne({ signupId });
    if (!pending) {
      return res.status(404).json(ApiResponse({}, "Signup expired or invalid", false));
    }
    const cluster = await Cluster.findById(pending.clusterId);
    const regionName = cluster ? cluster.name : "Unknown";
    if (await User.findOne({ email: pending.email })) {
      await PendingSignup.deleteOne({ signupId });
      return res.status(409).json(ApiResponse({}, "Email already registered", false));
    }
    const memberId = await generateMemberId(User);
    const user = new User({
      email: pending.email,
      password: pending.hashedPassword,
      name: pending.contactName,
      businessName: pending.businessName,
      industry: "General",
      region: regionName,
      clusterId: pending.clusterId,
      status: "active",
      referralCode: pending.referralCode,
      databaseSize: pending.databaseSize ?? 0,
      residualEarnings: 0,
      memberId,
    });
    const customerId = session.customer && (typeof session.customer === "string" ? session.customer : session.customer.id);
    const stripeSub = session.subscription && (typeof session.subscription === "object" ? session.subscription : null);
    if (customerId) {
      user.stripeCustomerId = customerId;
      await user.save();
    }
    if (stripeSub && stripeSub.id) {
      let planId = await Plan.findOne({ active: true }).sort({ createdAt: 1 }).select("_id").lean();
      if (!planId) planId = await Plan.findOne({}).sort({ createdAt: 1 }).select("_id").lean();
      await Subscription.create({
        userId: user._id,
        planId: planId?._id || planId,
        status: stripeSub.status === "active" ? "active" : stripeSub.status,
        currentPeriodEnd: stripeSub.current_period_end ? new Date(stripeSub.current_period_end * 1000) : undefined,
        referralDiscountApplied: false,
        stripeSubscriptionId: stripeSub.id,
      });
    }
    if (
      pending.referralCode &&
      pending.referralCode !== "NONE"
    ) {
      const referrer = await User.findOne({
        $or: [
          { memberId: { $regex: new RegExp(`^${pending.referralCode.trim()}$`, "i") } },
          { referralCode: pending.referralCode },
        ],
        status: "active",
      });
      if (referrer) {
        await Referral.create({
          referrerUserId: referrer._id,
          referrerMemberId: referrer.memberId,
          businessName: pending.businessName,
          region: regionName,
          status: "Active",
          discountAmount: "$4.99",
          earningsPerMonth: "$5.00/mo",
        });
      }
    }
    await PendingSignup.deleteOne({ signupId });
    const token = generateToken(user);
    const u = user.toObject();
    delete u.password;
    return res.json(ApiResponse({ user: u, token }, "Signup complete", true));
  } catch (err) {
    console.error(err);
    return res.status(500).json(ApiResponse({}, err.message || "Complete signup failed", false));
  }
};
