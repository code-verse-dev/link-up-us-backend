const express = require("express");
const { list, getVideo, play, saveProgress } = require("../../controllers/training");
const { userRoute } = require("../../middleware");

const router = express.Router();

router.get("/", list);
router.get("/videos/:id", getVideo);
router.get("/stream/:id", play);
router.post("/progress", userRoute, saveProgress);

module.exports = router;
