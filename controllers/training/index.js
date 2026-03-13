const TrainingVideo = require("../../models/TrainingVideo");
const { ApiResponse } = require("../../helpers");
const mongoose = require("mongoose");

exports.list = async (req, res) => {
  try {
    const list = await TrainingVideo.find({}).lean();
    return res.json(ApiResponse(list, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.play = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json(ApiResponse({}, "Invalid video id", false));
    }

    const video = await TrainingVideo.findById(id).lean();
    if (!video) {
      return res.status(404).json(ApiResponse({}, "Video not found", false));
    }
    if (!video.videoUrl) {
      return res.status(404).json(ApiResponse({}, "Video URL missing", false));
    }

    return res.redirect(video.videoUrl);
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
