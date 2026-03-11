const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const clusterSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    description: { type: String },
  },
  { timestamps: true }
);

clusterSchema.index({ order: 1 });
clusterSchema.index({ active: 1 });

module.exports = mongoose.model("Cluster", clusterSchema);
