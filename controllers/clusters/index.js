const Cluster = require("../../models/Cluster");
const { ApiResponse } = require("../../helpers");

exports.list = async (req, res) => {
  try {
    const activeOnly = req.query.active !== "false";
    const filter = activeOnly ? { active: true } : {};
    const list = await Cluster.find(filter).sort({ order: 1, name: 1 }).lean();
    return res.json(ApiResponse(list, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.create = async (req, res) => {
  try {
    const { name, order, active, description } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json(ApiResponse({}, "name is required", false));
    }
    const existing = await Cluster.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json(ApiResponse({}, "Cluster with this name already exists", false));
    }
    const cluster = new Cluster({
      name: name.trim(),
      order: order != null ? Number(order) : 0,
      active: active !== false,
      description: description || undefined,
    });
    await cluster.save();
    return res.status(201).json(ApiResponse(cluster.toObject(), "Cluster created", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, order, active, description } = req.body || {};
    const cluster = await Cluster.findById(id);
    if (!cluster) {
      return res.status(404).json(ApiResponse({}, "Cluster not found", false));
    }
    if (name !== undefined) cluster.name = name.trim();
    if (order !== undefined) cluster.order = Number(order);
    if (active !== undefined) cluster.active = !!active;
    if (description !== undefined) cluster.description = description;
    await cluster.save();
    return res.json(ApiResponse(cluster.toObject(), "Cluster updated", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const cluster = await Cluster.findByIdAndDelete(id);
    if (!cluster) {
      return res.status(404).json(ApiResponse({}, "Cluster not found", false));
    }
    return res.json(ApiResponse({ id }, "Cluster deleted", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
