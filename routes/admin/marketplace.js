const express = require("express");
const { list, get, create, update, remove, uploadImage } = require("../../controllers/admin/marketplace");
const { adminRoute } = require("../../middleware/adminAuth");
const { uploadBanner } = require("../../middleware/upload");

const router = express.Router();

router.post("/upload", adminRoute, uploadBanner, uploadImage);
router.get("/", list);
router.get("/:id", get);
router.post("/", create);
router.patch("/:id", update);
router.delete("/:id", remove);

module.exports = router;
