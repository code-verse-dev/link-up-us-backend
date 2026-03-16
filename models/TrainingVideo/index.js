const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const trainingSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    duration: { type: String },
    thumbnail: { type: String },
    videoUrl: { type: String },
    sectionId: { type: Schema.Types.ObjectId, ref: "TrainingSection" },
    source: { type: String, enum: ["url", "upload"], default: "url" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TrainingVideo", trainingSchema);
