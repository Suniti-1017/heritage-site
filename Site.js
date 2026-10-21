import mongoose from "mongoose";
const siteSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  state: String, district: String, village: String, address: String,
  latitude: String, longitude: String,
  historicalBackground: String, significance: String, architecturalStyle: String,
  constructionMaterials: String, condition: String, conservationRecommendations: String,
  protectionStatus: String, references: String,
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  media: [{ type: mongoose.Schema.Types.ObjectId, ref: "Media" }]
}, { timestamps: true });
export default mongoose.model("Site", siteSchema);
