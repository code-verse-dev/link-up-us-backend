const ReferralTier = require("../../models/ReferralTier");
const { ApiResponse } = require("../../helpers");

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
