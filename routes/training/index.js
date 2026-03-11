const express = require("express");
const { list } = require("../../controllers/training");

const router = express.Router();

router.get("/", list);

module.exports = router;
