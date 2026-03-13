const Industry = require("../../models/Industry");
const { ApiResponse } = require("../../helpers");

exports.list = async (req, res) => {
  try {
    const activeOnly = req.query.active !== "false";
    const filter = activeOnly ? { active: true } : {};
    const list = await Industry.find(filter).sort({ order: 1, name: 1 }).lean();
    return res.json(ApiResponse(list, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.create = async (req, res) => {
  try {
    const { name, order, active } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json(ApiResponse({}, "name is required", false));
    }
    const existing = await Industry.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json(ApiResponse({}, "Industry with this name already exists", false));
    }
    const industry = new Industry({
      name: name.trim(),
      order: order != null ? Number(order) : 0,
      active: active !== false,
    });
    await industry.save();
    return res.status(201).json(ApiResponse(industry.toObject(), "Industry created", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, order, active } = req.body || {};
    const industry = await Industry.findById(id);
    if (!industry) {
      return res.status(404).json(ApiResponse({}, "Industry not found", false));
    }
    if (name !== undefined) industry.name = name.trim();
    if (order !== undefined) industry.order = Number(order);
    if (active !== undefined) industry.active = !!active;
    await industry.save();
    return res.json(ApiResponse(industry.toObject(), "Industry updated", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const industry = await Industry.findByIdAndDelete(id);
    if (!industry) {
      return res.status(404).json(ApiResponse({}, "Industry not found", false));
    }
    return res.json(ApiResponse({ id }, "Industry deleted", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
