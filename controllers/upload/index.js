const express = require("express");
const { uploadBanner } = require("../../middleware/upload");
const { ApiResponse } = require("../../helpers");

const router = express.Router();

router.post("/banner", uploadBanner, (req, res) => {
  if (!req.file || !req.file.filename) {
    return res.status(400).json(ApiResponse({}, "No file uploaded", false));
  }
  const url = `/Uploads/${req.file.filename}`;
  return res.json(ApiResponse({ url }, "Banner uploaded", true));
});

module.exports = router;
