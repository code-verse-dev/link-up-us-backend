const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const marketplaceItemSchema = new Schema(
  {
    businessName: { type: String, required: true },
    name: { type: String },
    region: { type: String, default: "" },
    logoUrl: { type: String },
    partnerBannerUrl: { type: String },
    databaseSize: { type: Number },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    source: { type: String, enum: ["member", "partner"], default: "member" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MarketplaceItem", marketplaceItemSchema);
