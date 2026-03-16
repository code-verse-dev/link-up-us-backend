const EmailTemplate = require("../../models/EmailTemplate");
const { ApiResponse } = require("../../helpers");

/** GET /api/admin/templates */
exports.list = async (req, res) => {
  try {
    const includeContent = req.query.includeContent === "1" || req.query.includeContent === "true";
    const search = (req.query.search || "").trim();
    const filter = search
      ? { $or: [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }] }
      : {};
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);
    const [list, total] = await Promise.all([
      EmailTemplate.find(filter).sort({ order: 1, title: 1 }).skip(skip).limit(limit).lean(),
      EmailTemplate.countDocuments(filter),
    ]);
    if (!includeContent && list.length) {
      list.forEach((t) => delete t.htmlContent);
    }
    return res.json(ApiResponse({ templates: list, total, limit, skip }, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** GET /api/admin/templates/:id */
exports.get = async (req, res) => {
  try {
    const doc = await EmailTemplate.findById(req.params.id).lean();
    if (!doc) return res.status(404).json(ApiResponse({}, "Template not found", false));
    return res.json(ApiResponse(doc, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** POST /api/admin/templates */
exports.create = async (req, res) => {
  try {
    const { title, description, previewUrl, htmlFile, order, htmlContent } = req.body || {};
    if (!title || !title.trim()) {
      return res.status(400).json(ApiResponse({}, "title required", false));
    }
    const template = new EmailTemplate({
      title: title.trim(),
      description: description != null ? String(description) : undefined,
      previewUrl: previewUrl || undefined,
      htmlFile: htmlFile || undefined,
      order: order != null ? Number(order) : 0,
      htmlContent: htmlContent != null ? String(htmlContent) : "",
    });
    await template.save();
    return res.status(201).json(ApiResponse(template.toObject(), "Created", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** PUT /api/admin/templates/:id */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, previewUrl, htmlFile, order, htmlContent } = req.body || {};
    const template = await EmailTemplate.findById(id);
    if (!template) return res.status(404).json(ApiResponse({}, "Template not found", false));
    if (title !== undefined) template.title = title.trim();
    if (description !== undefined) template.description = description;
    if (previewUrl !== undefined) template.previewUrl = previewUrl;
    if (htmlFile !== undefined) template.htmlFile = htmlFile;
    if (order !== undefined) template.order = Number(order);
    if (htmlContent !== undefined) template.htmlContent = htmlContent;
    await template.save();
    return res.json(ApiResponse(template.toObject(), "Updated", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** DELETE /api/admin/templates/:id */
exports.remove = async (req, res) => {
  try {
    const template = await EmailTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json(ApiResponse({}, "Template not found", false));
    return res.json(ApiResponse({ id: req.params.id }, "Deleted", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
