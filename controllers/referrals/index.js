const Referral = require("../../models/Referral");
const { ApiResponse } = require("../../helpers");

function getReferralFilter(req) {
  const userId = req.user?._id || req.headers["x-user-id"] || req.query?.userId;
  return userId ? { referrerUserId: userId } : {};
}

exports.summary = async (req, res) => {
  try {
    const filter = getReferralFilter(req);
    const [total, activeCount, inactiveCount] = await Promise.all([
      Referral.countDocuments(filter),
      Referral.countDocuments({ ...filter, status: "Active" }),
      Referral.countDocuments({ ...filter, status: "Inactive" }),
    ]);
    return res.json(
      ApiResponse(
        { total, activeCount, inactiveCount },
        "OK",
        true
      )
    );
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

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
