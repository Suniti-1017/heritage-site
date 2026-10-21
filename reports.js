import { Router } from "express";
import Report from "../models/Report.js";
import Site from "../models/Site.js";
import { protect } from "../middleware/auth.js";
const router = Router();
router.use(protect);
router.get("/", async (_req, res, next) => {
  try { res.json(await Report.find().populate("site", "name district state").populate("createdBy", "name email").sort({ createdAt: -1 })); }
  catch (e) { next(e); }
});
router.post("/", async (req, res, next) => {
  try {
    const { title, site, reportType } = req.body;
    if (!title?.trim() || !site) return res.status(400).json({ message: "Report title and heritage site are required." });
    if (!await Site.findById(site)) return res.status(400).json({ message: "Selected heritage site does not exist." });
    const report = await Report.create({
      title: title.trim(), site, reportType,
      materialType: req.body.materialType, testMethod: req.body.testMethod, equipment: req.body.equipment,
      inspectionDate: req.body.inspectionDate, measurements: req.body.measurements,
      observations: req.body.observations, limitations: req.body.limitations,
      recommendations: req.body.recommendations, references: req.body.references,
      createdBy: req.user._id
    });
    res.status(201).json(await report.populate([{ path: "site", select: "name district state" }, { path: "createdBy", select: "name email" }]));
  } catch (e) { next(e); }
});
export default router;
