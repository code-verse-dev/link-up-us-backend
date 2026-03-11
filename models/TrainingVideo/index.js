const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const trainingSchema = new Schema(
  {
    title: { type: String, required: true },
    duration: { type: String },
    thumbnail: { type: String },
    videoUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TrainingVideo", trainingSchema);
