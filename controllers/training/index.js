const TrainingVideo = require("../../models/TrainingVideo");
const TrainingProgress = require("../../models/TrainingProgress");
const { ApiResponse } = require("../../helpers");
const mongoose = require("mongoose");
const { Readable } = require("stream");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");

exports.list = async (req, res) => {
  try {
    const list = await TrainingVideo.find({}).sort({ order: 1, title: 1 }).lean();
    let userId = null;
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded._id).select("_id").lean();
        if (user) userId = user._id;
      } catch (_) {}
    }
    if (userId) {
      const progressList = await TrainingProgress.find({ userId }).lean();
      const progressByVideo = {};
      progressList.forEach((p) => {
        progressByVideo[p.videoId.toString()] = {
          progressPercent: p.progressPercent ?? 0,
          completed: !!p.completed,
          completedAt: p.completedAt,
        };
      });
      list.forEach((v) => {
        const p = progressByVideo[v._id.toString()];
        v.progress = p || { progressPercent: 0, completed: false };
      });
    } else {
      list.forEach((v) => {
        v.progress = { progressPercent: 0, completed: false };
      });
    }
    return res.json(ApiResponse(list, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** GET /api/training/videos/:id — return video metadata as JSON (for modal/detail) */
exports.getVideo = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json(ApiResponse({}, "Invalid video id", false));
    }
    const video = await TrainingVideo.findById(id).lean();
    if (!video) {
      return res.status(404).json(ApiResponse({}, "Video not found", false));
    }
    return res.json(ApiResponse(video, "OK", true));
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

    // Stream from local file when source is upload (path like /Uploads/video-xxx.mp4)
    const isLocalUpload = video.source === "upload" && typeof video.videoUrl === "string" && !video.videoUrl.startsWith("http");
    if (isLocalUpload) {
      const filePath = path.join(__dirname, "..", video.videoUrl.replace(/^\//, ""));
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        return res.status(404).json(ApiResponse({}, "Video file not found", false));
      }
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;
      const ext = path.extname(filePath).toLowerCase();
      const mime = ext === ".webm" ? "video/webm" : ext === ".mov" ? "video/quicktime" : "video/mp4";
      res.setHeader("Content-Type", mime);
      res.setHeader("Accept-Ranges", "bytes");

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
        res.setHeader("Content-Length", chunkSize);
        res.status(206);
        const stream = fs.createReadStream(filePath, { start, end });
        stream.pipe(res);
      } else {
        res.setHeader("Content-Length", fileSize);
        res.status(200);
        fs.createReadStream(filePath).pipe(res);
      }
      return;
    }

    // External URL: proxy with range
    const upstreamHeaders = {};
    if (req.headers.range) {
      upstreamHeaders.Range = req.headers.range;
    }
    const videoUrl = video.videoUrl.startsWith("http") ? video.videoUrl : `http://localhost:${process.env.PORT || 3045}${video.videoUrl}`;
    const upstream = await fetch(videoUrl, {
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

/** POST /api/training/progress — save or update progress (auth required) */
exports.saveProgress = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json(ApiResponse({}, "Unauthorized", false));
    }
    const { videoId, progressPercent, completed } = req.body || {};
    if (!videoId) {
      return res.status(400).json(ApiResponse({}, "videoId required", false));
    }
    const progress = await TrainingProgress.findOneAndUpdate(
      { userId, videoId },
      {
        $set: {
          progressPercent: Math.min(100, Math.max(0, Number(progressPercent) || 0)),
          completed: !!completed,
          ...(completed ? { completedAt: new Date() } : {}),
        },
      },
      { upsert: true, new: true }
    ).lean();
    return res.json(
      ApiResponse(
        {
          videoId: progress.videoId,
          progressPercent: progress.progressPercent,
          completed: progress.completed,
        },
        "OK",
        true
      )
    );
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
