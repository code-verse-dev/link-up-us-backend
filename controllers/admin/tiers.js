const ReferralTier = require("../../models/ReferralTier");
const User = require("../../models/User");
const Referral = require("../../models/Referral");
const { ApiResponse } = require("../../helpers");

/** GET /api/admin/tiers — list all tiers (admin can see inactive) */
exports.list = async (req, res) => {
  try {
    const activeOnly = req.query.active !== "false";
    const filter = activeOnly ? { active: true } : {};
    const list = await ReferralTier.find(filter).sort({ sortOrder: 1, minReferrals: 1 }).lean();
    const data = list.map((t) => ({
      _id: t._id.toString(),
      name: t.name,
      label: t.label,
      description: t.description,
      minReferrals: t.minReferrals,
      sortOrder: t.sortOrder,
      active: t.active,
    }));
    return res.json(ApiResponse(data, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** POST /api/admin/tiers — create tier */
exports.create = async (req, res) => {
  try {
    const { name, label, description, minReferrals, sortOrder, active } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json(ApiResponse({}, "name is required", false));
    }
    const tier = new ReferralTier({
      name: name.trim(),
      label: label != null ? String(label).trim() : undefined,
      description: description != null ? String(description).trim() : undefined,
      minReferrals: minReferrals != null ? Number(minReferrals) : 0,
      sortOrder: sortOrder != null ? Number(sortOrder) : 0,
      active: active !== false,
    });
    await tier.save();
    const obj = tier.toObject();
    return res.status(201).json(
      ApiResponse(
        {
          _id: obj._id.toString(),
          name: obj.name,
          label: obj.label,
          description: obj.description,
          minReferrals: obj.minReferrals,
          sortOrder: obj.sortOrder,
          active: obj.active,
        },
        "Tier created",
        true
      )
    );
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** PUT /api/admin/tiers/:id — update tier */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, label, description, minReferrals, sortOrder, active } = req.body || {};
    const tier = await ReferralTier.findById(id);
    if (!tier) {
      return res.status(404).json(ApiResponse({}, "Tier not found", false));
    }
    if (name !== undefined) tier.name = name.trim();
    if (label !== undefined) tier.label = String(label).trim();
    if (description !== undefined) tier.description = String(description).trim();
    if (minReferrals !== undefined) tier.minReferrals = Number(minReferrals);
    if (sortOrder !== undefined) tier.sortOrder = Number(sortOrder);
    if (active !== undefined) tier.active = !!active;
    await tier.save();
    const obj = tier.toObject();
    return res.json(
      ApiResponse(
        {
          _id: obj._id.toString(),
          name: obj.name,
          label: obj.label,
          description: obj.description,
          minReferrals: obj.minReferrals,
          sortOrder: obj.sortOrder,
          active: obj.active,
        },
        "Tier updated",
        true
      )
    );
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** DELETE /api/admin/tiers/:id — remove tier */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const tier = await ReferralTier.findByIdAndDelete(id);
    if (!tier) {
      return res.status(404).json(ApiResponse({}, "Tier not found", false));
    }
    return res.json(ApiResponse({ id }, "Tier deleted", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** GET /api/admin/tiers/:id — single tier with members list (optional ?search= to filter members) */
exports.getWithMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const search = (req.query.search || "").trim();
    const tierDoc = await ReferralTier.findById(id).lean();
    if (!tierDoc) {
      return res.status(404).json(ApiResponse({}, "Tier not found", false));
    }
    const tier = {
      _id: tierDoc._id.toString(),
      name: tierDoc.name,
      label: tierDoc.label,
      description: tierDoc.description,
      minReferrals: tierDoc.minReferrals,
      sortOrder: tierDoc.sortOrder,
      active: tierDoc.active,
      memberCount: 0,
      members: [],
    };

    const allTiers = await ReferralTier.find({}).sort({ sortOrder: 1, minReferrals: 1 }).lean();
    const tierByMin = allTiers
      .map((t) => ({ _id: t._id.toString(), minReferrals: t.minReferrals }))
      .sort((a, b) => b.minReferrals - a.minReferrals);
    const currentIdx = tierByMin.findIndex((t) => t._id === tier._id);
    const nextTier = currentIdx >= 0 && currentIdx < tierByMin.length - 1 ? tierByMin[currentIdx + 1] : null;
    const minForThisTier = tierDoc.minReferrals;
    const maxForThisTier = nextTier ? nextTier.minReferrals - 1 : null;

    const userFilter = { status: "active" };
    if (search) {
      userFilter.$or = [
        { memberId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }
    const users = await User.find(userFilter).select("_id memberId email businessName name").lean();
    const userIds = users.map((u) => u._id);

    const activeCounts = await Referral.aggregate([
      { $match: { referrerUserId: { $in: userIds }, status: "Active" } },
      { $group: { _id: "$referrerUserId", count: { $sum: 1 } } },
    ]);
    const countByUser = {};
    activeCounts.forEach((c) => {
      countByUser[c._id.toString()] = c.count;
    });

    users.forEach((u) => {
      const activeReferrals = countByUser[u._id.toString()] || 0;
      const inThisTier = activeReferrals >= minForThisTier && (maxForThisTier === null || activeReferrals <= maxForThisTier);
      if (inThisTier) {
        tier.members.push({
          userId: u._id.toString(),
          memberId: u.memberId,
          email: u.email,
          businessName: u.businessName,
          name: u.name,
          activeReferrals,
        });
      }
    });
    tier.memberCount = tier.members.length;

    return res.json(ApiResponse({ tier }, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** GET /api/admin/tiers/members — tiers with member counts and list of members per tier (by active referral count) */
exports.members = async (req, res) => {
  try {
    const tiers = await ReferralTier.find({}).sort({ sortOrder: 1, minReferrals: 1 }).lean();
    const tierList = tiers.map((t) => ({
      _id: t._id.toString(),
      name: t.name,
      label: t.label,
      minReferrals: t.minReferrals,
      sortOrder: t.sortOrder,
      active: t.active,
      memberCount: 0,
      members: [],
    }));

    const users = await User.find({ status: "active" })
      .select("_id memberId email businessName name")
      .lean();
    const userIds = users.map((u) => u._id);

    const activeCounts = await Referral.aggregate([
      { $match: { referrerUserId: { $in: userIds }, status: "Active" } },
      { $group: { _id: "$referrerUserId", count: { $sum: 1 } } },
    ]);
    const countByUser = {};
    activeCounts.forEach((c) => {
      countByUser[c._id.toString()] = c.count;
    });

    const tierByMin = [...tierList].sort((a, b) => b.minReferrals - a.minReferrals);

    tierList.forEach((t) => {
      t.members = [];
    });

    const tierIdToTier = {};
    tierList.forEach((t) => {
      tierIdToTier[t._id] = t;
    });

    users.forEach((u) => {
      const activeReferrals = countByUser[u._id.toString()] || 0;
      let assignedTier = null;
      for (const t of tierByMin) {
        if (activeReferrals >= t.minReferrals) {
          assignedTier = t;
          break;
        }
      }
      const member = {
        userId: u._id.toString(),
        memberId: u.memberId,
        email: u.email,
        businessName: u.businessName,
        name: u.name,
        activeReferrals,
      };
      if (assignedTier) {
        assignedTier.members.push(member);
      }
    });

    tierList.forEach((t) => {
      t.memberCount = t.members.length;
    });

    return res.json(ApiResponse({ tiers: tierList }, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
