const express = require("express");
const { list, getDefault, validateReferralCode, update } = require("../../controllers/plans");

const router = express.Router();

router.get("/", list);
router.get("/default", getDefault);
router.put("/:id", update);
router.get("/validate-referral", validateReferralCode);
router.post("/validate-referral", validateReferralCode);

module.exports = router;
