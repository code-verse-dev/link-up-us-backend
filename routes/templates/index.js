const express = require("express");
const { list } = require("../../controllers/templates");

const router = express.Router();

router.get("/", list);

module.exports = router;
