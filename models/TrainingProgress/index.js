const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const trainingProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    videoId: { type: Schema.Types.ObjectId, ref: "TrainingVideo", required: true },
    progressPercent: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

trainingProgressSchema.index({ userId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model("TrainingProgress", trainingProgressSchema);
