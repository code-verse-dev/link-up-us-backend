const EmailTemplate = require("../../models/EmailTemplate");
const { ApiResponse } = require("../../helpers");

exports.list = async (req, res) => {
  try {
    const includeContent = req.query.includeContent === "1" || req.query.includeContent === "true";
    const query = EmailTemplate.find({}).sort({ order: 1, title: 1 });
    const list = await query.lean();
    if (!includeContent && list.length) {
      list.forEach((t) => delete t.htmlContent);
    }
    return res.json(ApiResponse(list, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.getById = async (req, res) => {
  try {
    const doc = await EmailTemplate.findById(req.params.id).lean();
    if (!doc) return res.status(404).json(ApiResponse({}, "Template not found", false));
    return res.json(ApiResponse(doc, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
