const User = require("../../models/User");
const { ApiResponse } = require("../../helpers");

exports.verifyMember = async (req, res) => {
  try {
    const memberId =
      (req.query && req.query.memberId) || (req.body && req.body.memberId);
    if (!memberId || typeof memberId !== "string") {
      return res
        .status(400)
        .json(
          ApiResponse(
            { valid: false, message: "Member ID required" },
            "Bad request",
            false
          )
        );
    }
    const normalized = memberId.trim().toUpperCase();
    const user = await User.findOne({
      memberId: { $regex: new RegExp(`^${normalized}$`, "i") },
    }).lean();
    if (!user) {
      return res.json(
        ApiResponse(
          { valid: false, message: "Membership inactive or invalid." },
          "OK",
          true
        )
      );
    }
    if (user.status !== "active") {
      return res.json(
        ApiResponse(
          {
            valid: false,
            memberId: user.memberId,
            businessName: user.businessName,
            message: "Membership inactive or invalid.",
            eligibleForDiscount: false,
          },
          "OK",
          true
        )
      );
    }
    return res.json(
      ApiResponse(
        {
          valid: true,
          memberId: user.memberId,
          businessName: user.businessName,
          message: "Verified Link-up Member – Eligible for 15% Discount",
          eligibleForDiscount: true,
        },
        "OK",
        true
      )
    );
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
