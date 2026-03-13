const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const industrySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

industrySchema.index({ order: 1 });
industrySchema.index({ active: 1 });

module.exports = mongoose.model("Industry", industrySchema);
