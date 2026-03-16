const express = require("express");
const { list, get, search, create, update, remove, uploadImage } = require("../../controllers/partners");
const { uploadLogo } = require("../../middleware/upload");

const router = express.Router();

router.post("/upload", uploadLogo, uploadImage);
router.get("/", list);
router.get("/search", search);
router.get("/:id", get);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

module.exports = router;
