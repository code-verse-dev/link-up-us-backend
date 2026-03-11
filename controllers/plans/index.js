const Plan = require("../../models/Plan");
const User = require("../../models/User");
const { ApiResponse } = require("../../helpers");

const REFERRAL_FIRST_MONTH_CENTS = 499;

exports.list = async (req, res) => {
  try {
    const list = await Plan.find({}).sort({ createdAt: 1 }).lean();
    if (list.length === 0) {
      const defaultPlan = new Plan({
        name: "Link-up.us Monthly",
        priceCents: 1999,
        interval: "month",
        description: "$19.99/month – Full member access.",
        subtitle: "Cancel anytime. Earn $5/mo per referral.",
        active: true,
      });
      await defaultPlan.save();
      return res.json(ApiResponse([defaultPlan.toObject()], "OK", true));
    }
    return res.json(ApiResponse(list, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.getDefault = async (req, res) => {
  try {
    let plan = await Plan.findOne({ active: true }).sort({ createdAt: 1 }).lean();
    if (!plan) {
      plan = await Plan.findOne({}).sort({ createdAt: 1 }).lean();
    }
    if (!plan) {
      return res.status(404).json(ApiResponse({}, "No plan configured", false));
    }
    return res.json(ApiResponse(plan, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, priceCents, interval, description, subtitle, active } = req.body || {};
    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json(ApiResponse({}, "Plan not found", false));
    }
    if (name !== undefined) plan.name = name;
    if (priceCents !== undefined) plan.priceCents = Number(priceCents);
    if (interval !== undefined) plan.interval = interval;
    if (description !== undefined) plan.description = description;
    if (subtitle !== undefined) plan.subtitle = subtitle;
    if (active !== undefined) plan.active = !!active;
    await plan.save();
    return res.json(ApiResponse(plan.toObject(), "Plan updated", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.validateReferralCode = async (req, res) => {
  try {
    const code = (req.query && req.query.code) || (req.body && req.body.code);
    if (!code || typeof code !== "string") {
      return res
        .status(400)
        .json(
          ApiResponse(
            { valid: false, message: "Referral code required" },
            "Bad request",
            false
          )
        );
    }
    const normalized = code.trim().toUpperCase();
    const referrer = await User.findOne({
      memberId: { $regex: new RegExp(`^${normalized}$`, "i") },
      status: "active",
    }).lean();
    if (!referrer) {
      return res.json(
        ApiResponse(
          { valid: false, message: "Invalid or inactive referral code." },
          "OK",
          true
        )
      );
    }
    return res.json(
      ApiResponse(
        {
          valid: true,
          referrerMemberId: referrer.memberId,
          firstMonthPriceCents: REFERRAL_FIRST_MONTH_CENTS,
          message: "Valid referral code. First month: $4.99",
        },
        "OK",
        true
      )
    );
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
