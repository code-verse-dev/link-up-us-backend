const express = require("express");
const {
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  uploadCourseThumbnail,
  listSections,
  createSection,
  updateSection,
  deleteSection,
  listVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  uploadVideoFile,
  uploadVideoThumbnail,
  listProgress,
} = require("../../controllers/admin/training");
const { uploadThumbnail, uploadVideoFile: uploadVideoFileMw } = require("../../middleware/upload");

const router = express.Router();

router.post("/courses/upload-thumbnail", uploadThumbnail, uploadCourseThumbnail);
router.get("/courses", listCourses);
router.post("/courses", createCourse);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);

router.get("/sections", listSections);
router.post("/sections", createSection);
router.put("/sections/:id", updateSection);
router.delete("/sections/:id", deleteSection);

router.post("/videos/upload-video", uploadVideoFileMw, uploadVideoFile);
router.post("/videos/upload-thumbnail", uploadThumbnail, uploadVideoThumbnail);
router.get("/videos", listVideos);
router.post("/videos", createVideo);
router.put("/videos/:id", updateVideo);
router.delete("/videos/:id", deleteVideo);

router.get("/progress", listProgress);

module.exports = router;
