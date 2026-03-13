const express = require("express");
const { list, play } = require("../../controllers/training");

const router = express.Router();

router.get("/", list);
router.get("/videos/:id", play);

module.exports = router;
