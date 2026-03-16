const User = require("../../models/User");
const { ApiResponse, generateMemberId } = require("../../helpers");
const bcrypt = require("bcryptjs");

/** GET /api/admin/users — list all users with pagination and filters */
exports.list = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = parseInt(req.query.skip, 10) || 0;
    const status = req.query.status;
    const search = (req.query.search || "").trim();
    const filter = {};
    if (status === "active" || status === "inactive") filter.status = status;
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } },
        { memberId: { $regex: search, $options: "i" } },
      ];
    }
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);
    return res.json(ApiResponse({ users, total, limit, skip }, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** GET /api/admin/users/:id */
exports.get = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password").lean();
    if (!user) return res.status(404).json(ApiResponse({}, "User not found", false));
    return res.json(ApiResponse(user, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** POST /api/admin/users — create user */
exports.create = async (req, res) => {
  try {
    const { email, password, name, businessName, industry, region, status, memberId } = req.body || {};
    if (!email || !password || !name || !businessName || !region) {
      return res.status(400).json(ApiResponse({}, "email, password, name, businessName, region required", false));
    }
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json(ApiResponse({}, "Email already registered", false));
    }
    const finalMemberId = memberId && memberId.trim() ? memberId.trim() : await generateMemberId(User);
    if (memberId && (await User.findOne({ memberId: finalMemberId }))) {
      return res.status(409).json(ApiResponse({}, "Member ID already taken", false));
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      email: email.toLowerCase(),
      password: hashed,
      name,
      businessName,
      industry: industry || "General",
      region,
      status: status === "inactive" ? "inactive" : "active",
      memberId: finalMemberId,
    });
    await user.save();
    const u = user.toObject();
    delete u.password;
    return res.status(201).json(ApiResponse(u, "User created", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** PATCH /api/admin/users/:id */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ["name", "businessName", "email", "industry", "region", "phone", "address", "website", "partnerBannerUrl", "status"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.status && !["active", "inactive"].includes(updates.status)) delete updates.status;
    const user = await User.findByIdAndUpdate(id, { $set: updates }, { new: true }).select("-password").lean();
    if (!user) return res.status(404).json(ApiResponse({}, "User not found", false));
    return res.json(ApiResponse(user, "User updated", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** PATCH /api/admin/users/:id/member-id — change member ID */
exports.updateMemberId = async (req, res) => {
  try {
    const { id } = req.params;
    const { memberId } = req.body || {};
    if (!memberId || !memberId.trim()) {
      return res.status(400).json(ApiResponse({}, "memberId required", false));
    }
    const newId = memberId.trim();
    const existing = await User.findOne({ memberId: newId });
    if (existing && existing._id.toString() !== id) {
      return res.status(409).json(ApiResponse({}, "Member ID already taken", false));
    }
    const user = await User.findByIdAndUpdate(id, { memberId: newId }, { new: true }).select("-password").lean();
    if (!user) return res.status(404).json(ApiResponse({}, "User not found", false));
    return res.json(ApiResponse(user, "Member ID updated", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** DELETE /api/admin/users/:id */
exports.remove = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json(ApiResponse({}, "User not found", false));
    return res.json(ApiResponse({ id: req.params.id }, "User deleted", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** GET /api/admin/users/:id/banners — return banner/avatar URLs for user (for "see banners") */
exports.banners = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("partnerBannerUrl").lean();
    if (!user) return res.status(404).json(ApiResponse({}, "User not found", false));
    return res.json(ApiResponse({ partnerBannerUrl: user.partnerBannerUrl || null }, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
