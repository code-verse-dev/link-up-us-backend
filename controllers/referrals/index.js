const Referral = require("../../models/Referral");
const { ApiResponse } = require("../../helpers");

exports.list = async (req, res) => {
  try {
    const userId = req.user?._id || req.headers["x-user-id"] || req.query?.userId;
    const filter = userId ? { referrerUserId: userId } : {};
    const list = await Referral.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    const withJoinDate = list.map((r) => ({ ...r, joinDate: r.createdAt }));
    return res.json(ApiResponse(withJoinDate, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
