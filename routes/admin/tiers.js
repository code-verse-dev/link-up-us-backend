const express = require("express");
const { list, create, update, remove, members, getWithMembers } = require("../../controllers/admin/tiers");

const router = express.Router();

router.get("/members", members);
router.get("/", list);
router.get("/:id", getWithMembers);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

module.exports = router;
