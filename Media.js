import mongoose from "mongoose";
const mediaSchema = new mongoose.Schema({
  originalName: String, filename: String, url: String, extension: String,
  mimeType: String, size: Number, category: String,
  site: { type: mongoose.Schema.Types.ObjectId, ref: "Site" },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
export default mongoose.model("Media", mediaSchema);
