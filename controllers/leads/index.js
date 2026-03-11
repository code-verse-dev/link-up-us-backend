const Lead = require("../../models/Lead");
const { ApiResponse } = require("../../helpers");

exports.list = async (req, res) => {
  try {
    const list = await Lead.find({})
      .sort({ createdAt: -1 })
      .lean();
    const withDate = list.map((l) => ({ ...l, date: l.createdAt }));
    return res.json(ApiResponse(withDate, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.create = async (req, res) => {
  try {
    const { name, email, phone, offerId } = req.body || {};
    if (!name || !email) {
      return res.status(400).json(ApiResponse({}, "name and email required", false));
    }
    const lead = new Lead({ name, email, phone: phone || "", offerId });
    await lead.save();
    const out = lead.toObject();
    out.date = lead.createdAt;
    return res.status(201).json(ApiResponse(out, "Lead created", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
