const User = require("../../models/User");
const Referral = require("../../models/Referral");
const { ApiResponse } = require("../../helpers");

const baseUrl = process.env.FRONTEND_URL || "http://localhost:8080";

/** GET /api/admin/referrals/links — all referral links (per user: join URL + code + stats) */
exports.links = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);
    const search = (req.query.search || "").trim();
    const filter = { status: "active" };
    if (search) {
      filter.$or = [
        { memberId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } },
        { referralCode: { $regex: search, $options: "i" } },
      ];
    }
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("memberId email businessName name referralCode createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);
    const referrerIds = users.map((u) => u._id);
    const counts = await Referral.aggregate([
      { $match: { referrerUserId: { $in: referrerIds } } },
      { $group: { _id: "$referrerUserId", count: { $sum: 1 } } },
    ]);
    const countByUser = {};
    counts.forEach((c) => { countByUser[c._id.toString()] = c.count; });

    const links = users.map((u) => {
      const code = u.referralCode && u.referralCode !== "NONE" ? u.referralCode : u.memberId;
      const joinUrl = `${baseUrl}/link-up-us/join?ref=${encodeURIComponent(code)}`;
      return {
        userId: u._id,
        memberId: u.memberId,
        email: u.email,
        businessName: u.businessName,
        referralCode: code,
        joinUrl,
        referralCount: countByUser[u._id.toString()] || 0,
        createdAt: u.createdAt,
      };
    });
    return res.json(ApiResponse({ links, total, limit, skip }, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** GET /api/admin/referrals/links/:userId — details for one referral link (referrals list) */
exports.linkDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("memberId email businessName referralCode").lean();
    if (!user) return res.status(404).json(ApiResponse({}, "User not found", false));
    const code = user.referralCode && user.referralCode !== "NONE" ? user.referralCode : user.memberId;
    const joinUrl = `${baseUrl}/link-up-us/join?ref=${encodeURIComponent(code)}`;
    const referrals = await Referral.find({ referrerUserId: req.params.userId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(
      ApiResponse(
        {
          link: { userId: user._id, memberId: user.memberId, email: user.email, businessName: user.businessName, referralCode: code, joinUrl },
          referrals,
        },
        "OK",
        true
      )
    );
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** GET /api/admin/referrals — list all referrals (flat) */
exports.list = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const skip = parseInt(req.query.skip, 10) || 0;
    const [refs, total] = await Promise.all([
      Referral.find({})
        .populate("referrerUserId", "memberId email businessName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Referral.countDocuments(),
    ]);
    return res.json(ApiResponse({ referrals: refs, total, limit, skip }, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
