import { Router } from "express";
import Site from "../models/Site.js";
import { protect, allowRoles } from "../middleware/auth.js";
const router = Router();
router.use(protect);

router.get("/", async (req, res, next) => {
  try {
    const { q, status } = req.query;
    const filter = {};
    if (q) filter.$or = [{ name: new RegExp(escapeRegex(q), "i") }, { district: new RegExp(escapeRegex(q), "i") }, { state: new RegExp(escapeRegex(q), "i") }];
    if (status && ["pending", "approved", "rejected"].includes(status)) filter.status = status;
    const sites = await Site.find(filter).populate("createdBy", "name email").sort({ createdAt: -1 });
    res.json(sites);
  } catch (e) { next(e); }
});
router.post("/", async (req, res, next) => {
  try {
    if (!req.body.name?.trim()) return res.status(400).json({ message: "Site name is required." });
    const site = await Site.create({ ...pickSiteFields(req.body), name: req.body.name.trim(), createdBy: req.user._id });
    res.status(201).json(site);
  } catch (e) { next(e); }
});
router.get("/:id", async (req, res, next) => {
  try {
    const site = await Site.findById(req.params.id).populate("createdBy", "name email").populate("media");
    if (!site) return res.status(404).json({ message: "Heritage site not found." });
    res.json(site);
  } catch (e) { next(e); }
});
router.put("/:id", async (req, res, next) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).json({ message: "Heritage site not found." });
    if (String(site.createdBy) !== String(req.user._id) && req.user.role !== "admin")
      return res.status(403).json({ message: "Only the creator or an administrator can edit this record." });
    Object.assign(site, pickSiteFields(req.body));
    await site.save();
    res.json(site);
  } catch (e) { next(e); }
});
router.patch("/:id/status", allowRoles("admin"), async (req, res, next) => {
  try {
    if (!["pending", "approved", "rejected"].includes(req.body.status))
      return res.status(400).json({ message: "Invalid status." });
    const site = await Site.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!site) return res.status(404).json({ message: "Heritage site not found." });
    res.json(site);
  } catch (e) { next(e); }
});
router.delete("/:id", allowRoles("admin"), async (req, res, next) => {
  try {
    const site = await Site.findByIdAndDelete(req.params.id);
    if (!site) return res.status(404).json({ message: "Heritage site not found." });
    res.json({ message: "Site deleted." });
  } catch (e) { next(e); }
});
function pickSiteFields(body) {
  const keys = ["state","district","village","address","latitude","longitude","historicalBackground","significance","architecturalStyle","constructionMaterials","condition","conservationRecommendations","protectionStatus","references"];
  return Object.fromEntries(keys.filter(k => body[k] !== undefined).map(k => [k, body[k]]));
}
function escapeRegex(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
export default router;
