const express = require("express");
const { list, get, create, update, remove } = require("../../controllers/admin/templates");

const router = express.Router();

router.get("/", list);
router.get("/:id", get);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

module.exports = router;
