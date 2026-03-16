const TrainingCourse = require("../../models/TrainingCourse");
const TrainingSection = require("../../models/TrainingSection");
const TrainingVideo = require("../../models/TrainingVideo");
const TrainingProgress = require("../../models/TrainingProgress");
const User = require("../../models/User");
const { ApiResponse } = require("../../helpers");

// ——— Uploads ———
exports.uploadCourseThumbnail = async (req, res) => {
  try {
    if (!req.file || !req.file.filename) {
      return res.status(400).json(ApiResponse({}, "No file uploaded", false));
    }
    return res.json(ApiResponse({ url: `/Uploads/${req.file.filename}` }, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.uploadVideoFile = async (req, res) => {
  try {
    if (!req.file || !req.file.filename) {
      return res.status(400).json(ApiResponse({}, "No file uploaded", false));
    }
    return res.json(ApiResponse({ url: `/Uploads/${req.file.filename}` }, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.uploadVideoThumbnail = async (req, res) => {
  try {
    if (!req.file || !req.file.filename) {
      return res.status(400).json(ApiResponse({}, "No file uploaded", false));
    }
    return res.json(ApiResponse({ url: `/Uploads/${req.file.filename}` }, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

// ——— Courses ———
exports.listCourses = async (req, res) => {
  try {
    const list = await TrainingCourse.find({}).sort({ order: 1, name: 1 }).lean();
    return res.json(ApiResponse(list, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { name, description, thumbnail, order, active } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json(ApiResponse({}, "name required", false));
    const course = new TrainingCourse({
      name: name.trim(),
      description: description || "",
      thumbnail: thumbnail || undefined,
      order: order != null ? Number(order) : 0,
      active: active !== false,
    });
    await course.save();
    return res.status(201).json(ApiResponse(course.toObject(), "Created", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await TrainingCourse.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).lean();
    if (!course) return res.status(404).json(ApiResponse({}, "Course not found", false));
    return res.json(ApiResponse(course, "Updated", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await TrainingCourse.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json(ApiResponse({}, "Course not found", false));
    await TrainingSection.deleteMany({ courseId: req.params.id });
    return res.json(ApiResponse({ id: req.params.id }, "Deleted", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

// ——— Sections ———
exports.listSections = async (req, res) => {
  try {
    const courseId = req.query.courseId;
    const filter = courseId ? { courseId } : {};
    const list = await TrainingSection.find(filter).populate("courseId", "name").sort({ order: 1 }).lean();
    return res.json(ApiResponse(list, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.createSection = async (req, res) => {
  try {
    const { courseId, name, order, active } = req.body || {};
    if (!courseId || !name || !name.trim()) {
      return res.status(400).json(ApiResponse({}, "courseId and name required", false));
    }
    const section = new TrainingSection({
      courseId,
      name: name.trim(),
      order: order != null ? Number(order) : 0,
      active: active !== false,
    });
    await section.save();
    await section.populate("courseId", "name");
    return res.status(201).json(ApiResponse(section.toObject(), "Created", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.updateSection = async (req, res) => {
  try {
    const section = await TrainingSection.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate("courseId", "name").lean();
    if (!section) return res.status(404).json(ApiResponse({}, "Section not found", false));
    return res.json(ApiResponse(section, "Updated", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.deleteSection = async (req, res) => {
  try {
    const section = await TrainingSection.findByIdAndDelete(req.params.id);
    if (!section) return res.status(404).json(ApiResponse({}, "Section not found", false));
    await TrainingVideo.updateMany({ sectionId: req.params.id }, { $unset: { sectionId: 1 } });
    return res.json(ApiResponse({ id: req.params.id }, "Deleted", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

// ——— Videos ———
exports.listVideos = async (req, res) => {
  try {
    const sectionId = req.query.sectionId;
    const filter = sectionId ? { sectionId } : {};
    const list = await TrainingVideo.find(filter)
      .populate("sectionId", "name courseId")
      .sort({ order: 1, title: 1 })
      .lean();
    return res.json(ApiResponse(list, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.createVideo = async (req, res) => {
  try {
    const { title, description, duration, thumbnail, videoUrl, sectionId, source, order } = req.body || {};
    if (!title || !title.trim()) return res.status(400).json(ApiResponse({}, "title required", false));
    const video = new TrainingVideo({
      title: title.trim(),
      description: description || "",
      duration: duration || "",
      thumbnail: thumbnail || "",
      videoUrl: videoUrl || "",
      sectionId: sectionId || undefined,
      source: source === "upload" ? "upload" : "url",
      order: order != null ? Number(order) : 0,
    });
    await video.save();
    await video.populate("sectionId", "name courseId");
    return res.status(201).json(ApiResponse(video.toObject(), "Created", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.updateVideo = async (req, res) => {
  try {
    const video = await TrainingVideo.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate("sectionId", "name courseId").lean();
    if (!video) return res.status(404).json(ApiResponse({}, "Video not found", false));
    return res.json(ApiResponse(video, "Updated", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    const video = await TrainingVideo.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json(ApiResponse({}, "Video not found", false));
    await TrainingProgress.deleteMany({ videoId: req.params.id });
    return res.json(ApiResponse({ id: req.params.id }, "Deleted", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

// ——— Progress (completion details) ———
exports.listProgress = async (req, res) => {
  try {
    const userId = req.query.userId;
    const videoId = req.query.videoId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const skip = parseInt(req.query.skip, 10) || 0;
    const filter = {};
    if (userId) filter.userId = userId;
    if (videoId) filter.videoId = videoId;
    const [progress, total] = await Promise.all([
      TrainingProgress.find(filter)
        .populate("userId", "memberId email businessName")
        .populate("videoId", "title duration")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TrainingProgress.countDocuments(filter),
    ]);
    return res.json(ApiResponse({ progress, total, limit, skip }, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
