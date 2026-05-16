import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    projectName: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    documentUrl: { type: String, default: "", trim: true },
    status: { type: String, enum: ["Active", "Completed"], default: "Active" },
    comment: { type: String, default: "", trim: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        projectRole: { type: String, enum: ["QR", "PL", "Tasker"], default: "Tasker" },
      },
    ],
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

projectSchema.index({ createdBy: 1 });
projectSchema.index({ members: 1 });

export default mongoose.model("Project", projectSchema);
