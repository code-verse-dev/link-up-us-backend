const Subscription = require("../../models/Subscription");
const User = require("../../models/User");
const Plan = require("../../models/Plan");
const { ApiResponse } = require("../../helpers");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/** GET /api/admin/subscriptions/:id — get single subscription */
exports.get = async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id)
      .populate("userId", "memberId email name businessName")
      .populate("planId", "name priceCents interval")
      .lean();
    if (!sub) return res.status(404).json(ApiResponse({}, "Subscription not found", false));
    return res.json(ApiResponse(sub, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** GET /api/admin/subscriptions — list all subscriptions with user and plan info */
exports.list = async (req, res) => {
  try {
    const status = req.query.status;
    const search = (req.query.search || "").trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const skip = parseInt(req.query.skip, 10) || 0;
    const filter = status ? { status } : {};
    if (search) {
      const userIds = await User.find({
        $or: [
          { memberId: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { name: { $regex: search, $options: "i" } },
          { businessName: { $regex: search, $options: "i" } },
        ],
      })
        .select("_id")
        .lean();
      const ids = userIds.map((u) => u._id);
      if (ids.length === 0) {
        return res.json(ApiResponse({ subscriptions: [], total: 0, limit, skip }, "OK", true));
      }
      filter.userId = { $in: ids };
    }
    const [subs, total] = await Promise.all([
      Subscription.find(filter)
        .populate("userId", "memberId email name businessName")
        .populate("planId", "name priceCents interval")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Subscription.countDocuments(filter),
    ]);
    return res.json(ApiResponse({ subscriptions: subs, total, limit, skip }, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** POST /api/admin/subscriptions/:id/cancel — cancel at period end or immediately */
exports.cancel = async (req, res) => {
  try {
    const { id } = req.params;
    const { atPeriodEnd } = req.body || {};
    const sub = await Subscription.findById(id).populate("userId").populate("planId");
    if (!sub) return res.status(404).json(ApiResponse({}, "Subscription not found", false));

    if (sub.stripeSubscriptionId) {
      try {
        if (atPeriodEnd !== false) {
          await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
          sub.cancelAtPeriodEnd = true;
          await sub.save();
          return res.json(ApiResponse({ cancelAtPeriodEnd: true, currentPeriodEnd: sub.currentPeriodEnd }, "Cancel at period end set", true));
        } else {
          await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
          sub.status = "canceled";
          await sub.save();
          return res.json(ApiResponse({}, "Subscription canceled", true));
        }
      } catch (e) {
        if (e.code === "resource_missing") {
          sub.status = "canceled";
          await sub.save();
          return res.json(ApiResponse({}, "Subscription marked canceled", true));
        }
        throw e;
      }
    }
    sub.status = "canceled";
    if (atPeriodEnd !== false && sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) > new Date()) {
      sub.cancelAtPeriodEnd = true;
    } else {
      sub.cancelAtPeriodEnd = false;
    }
    await sub.save();
    return res.json(ApiResponse({ cancelAtPeriodEnd: sub.cancelAtPeriodEnd, currentPeriodEnd: sub.currentPeriodEnd }, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** POST /api/admin/subscriptions/:id/extend — extend current period in DB and in Stripe (trial_end = new period end so next invoice is delayed) */
exports.extend = async (req, res) => {
  try {
    const { id } = req.params;
    const { extendDays } = req.body || {};
    const days = Math.min(Math.max(parseInt(extendDays, 10) || 30, 1), 365);
    const sub = await Subscription.findById(id);
    if (!sub) return res.status(404).json(ApiResponse({}, "Subscription not found", false));

    const currentEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : new Date();
    const newEnd = new Date(currentEnd);
    newEnd.setDate(newEnd.getDate() + days);
    const newEndUnix = Math.floor(newEnd.getTime() / 1000);

    if (sub.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.update(sub.stripeSubscriptionId, {
          trial_end: newEndUnix,
          cancel_at_period_end: false,
          proration_behavior: "none",
        });
      } catch (e) {
        return res.status(500).json(ApiResponse({}, e.message || "Stripe update failed", false));
      }
    }

    sub.currentPeriodEnd = newEnd;
    await sub.save();

    return res.json(ApiResponse({ currentPeriodEnd: sub.currentPeriodEnd }, "Period extended", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
