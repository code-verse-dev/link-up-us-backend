const User = require("../../models/User");
const MarketplaceItem = require("../../models/MarketplaceItem");
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
    const region = req.query.region;
    const [users, marketplaceItems, totalUsers] = await Promise.all([
      User.find({ status: "active" })
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MarketplaceItem.find({ active: true }).sort({ sortOrder: 1, businessName: 1 }).lean(),
      User.countDocuments({ status: "active" }),
    ]);
    const userMembers = users.map((u) => ({
      _id: u._id,
      memberId: u.memberId,
      businessName: u.businessName,
      name: u.name,
      region: u.region || "",
      logoUrl: u.partnerBannerUrl || null,
      partnerBannerUrl: u.partnerBannerUrl || null,
      databaseSize: u.databaseSize,
      source: "member",
    }));
    const itemMembers = marketplaceItems.map((i) => ({
      _id: i._id,
      memberId: undefined,
      businessName: i.businessName,
      name: i.name,
      region: i.region || "",
      logoUrl: i.logoUrl || i.partnerBannerUrl || null,
      partnerBannerUrl: i.partnerBannerUrl || null,
      databaseSize: i.databaseSize,
      source: i.source || "member",
    }));
    const members = [...userMembers, ...itemMembers];
    const total = totalUsers + itemMembers.length;
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
