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
