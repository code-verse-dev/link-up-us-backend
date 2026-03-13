const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const partnerSchema = new Schema(
  {
    businessName: { type: String, required: true, trim: true },
    name: { type: String, trim: true },
    logoUrl: { type: String },
    region: { type: String, default: "", trim: true },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

partnerSchema.index({ sortOrder: 1 });
partnerSchema.index({ active: 1 });
partnerSchema.index({ businessName: "text", name: "text", region: "text" });

module.exports = mongoose.model("Partner", partnerSchema);
