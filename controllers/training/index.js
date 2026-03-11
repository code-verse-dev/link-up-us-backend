const TrainingVideo = require("../../models/TrainingVideo");
const { ApiResponse } = require("../../helpers");

exports.list = async (req, res) => {
  try {
    const list = await TrainingVideo.find({}).lean();
    return res.json(ApiResponse(list, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
