const EmailTemplate = require("../../models/EmailTemplate");
const { ApiResponse } = require("../../helpers");

exports.list = async (req, res) => {
  try {
    const list = await EmailTemplate.find({}).lean();
    return res.json(ApiResponse(list, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
