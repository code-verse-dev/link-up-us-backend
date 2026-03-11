const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const planSchema = new Schema(
  {
    name: { type: String, required: true },
    priceCents: { type: Number, required: true },
    interval: { type: String, enum: ["month"], default: "month" },
    description: { type: String },
    subtitle: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);
