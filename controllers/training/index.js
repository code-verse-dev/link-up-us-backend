const TrainingVideo = require("../../models/TrainingVideo");
const { ApiResponse } = require("../../helpers");
const mongoose = require("mongoose");
const { Readable } = require("stream");

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

    const upstreamHeaders = {};
    if (req.headers.range) {
      upstreamHeaders.Range = req.headers.range;
    }

    const upstream = await fetch(video.videoUrl, {
      method: "GET",
      headers: upstreamHeaders,
      redirect: "follow",
    });

    if (!upstream.ok && upstream.status !== 206) {
      return res
        .status(502)
        .json(ApiResponse({}, `Upstream video failed (${upstream.status})`, false));
    }

    const passHeaders = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "cache-control",
      "etag",
      "last-modified",
    ];
    for (const header of passHeaders) {
      const value = upstream.headers.get(header);
      if (value) res.setHeader(header, value);
    }
    if (!res.getHeader("content-type")) {
      res.setHeader("content-type", "video/mp4");
    }

    res.status(upstream.status === 206 ? 206 : 200);

    if (!upstream.body) {
      return res.status(502).json(ApiResponse({}, "Upstream video stream missing", false));
    }

    Readable.fromWeb(upstream.body).pipe(res);
    return;
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
