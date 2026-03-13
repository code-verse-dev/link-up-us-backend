const User = require("../../models/User");
const { ApiResponse } = require("../../helpers");

exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json(ApiResponse({}, "User not found", false));
    return res.json(ApiResponse(user, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.listMembers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const skip = parseInt(req.query.skip, 10) || 0;
    const [members, total] = await Promise.all([
      User.find()
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ]);
    return res.json(
      ApiResponse(
        { members, total, limit, skip },
        "OK",
        true
      )
    );
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.updateMe = async (req, res) => {
  try {
    const allowed = [
      "name",
      "businessName",
      "email",
      "industry",
      "region",
      "phone",
      "address",
      "website",
      "partnerBannerUrl",
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true }).select(
      "-password"
    );
    return res.json(ApiResponse(user, "Profile updated", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
