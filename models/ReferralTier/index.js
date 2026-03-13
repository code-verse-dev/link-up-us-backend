const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const referralTierSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    label: { type: String, trim: true },
    description: { type: String, trim: true },
    minReferrals: { type: Number, required: true, default: 0 },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

referralTierSchema.index({ sortOrder: 1 });
referralTierSchema.index({ active: 1 });

module.exports = mongoose.model("ReferralTier", referralTierSchema);
