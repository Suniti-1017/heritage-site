import mongoose from "mongoose";
const reportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  site: { type: mongoose.Schema.Types.ObjectId, ref: "Site", required: true },
  reportType: { type: String, enum: ["Architectural assessment", "Material testing", "Research report"], default: "Research report" },
  materialType: String, testMethod: String, equipment: String, inspectionDate: String,
  measurements: String, observations: String, limitations: String, recommendations: String, references: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
export default mongoose.model("Report", reportSchema);
