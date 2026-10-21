import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { fileURLToPath } from "url";
import Media from "../models/Media.js";
import Site from "../models/Site.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.use(protect);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, "../../uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const allowed = new Set([
  ".jpg",".jpeg",".png",".webp",".tif",".tiff",".pdf",".doc",".docx",".txt",
  ".glb",".gltf",".obj",".stl",".ply",".fbx",".3mf",".bin",".mtl"
]);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase())
});
const upload = multer({
  storage, limits: { fileSize: 50 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.has(ext)) return cb(new Error("File extension is not allowed."));
    cb(null, true);
  }
});
router.post("/", upload.array("files", 10), async (req, res, next) => {
  try {
    const siteId = req.body.siteId;
    if (siteId && !await Site.findById(siteId)) return res.status(400).json({ message: "Heritage site not found." });
    const docs = await Promise.all((req.files || []).map(file => Media.create({
      originalName: path.basename(file.originalname), filename: file.filename,
      url: `/uploads/${file.filename}`, extension: path.extname(file.originalname).toLowerCase(),
      mimeType: file.mimetype, size: file.size, category: req.body.category || "general",
      site: siteId || undefined, uploadedBy: req.user._id
    })));
    if (siteId && docs.length) await Site.findByIdAndUpdate(siteId, { $addToSet: { media: { $each: docs.map(d => d._id) } } });
    res.status(201).json(docs);
  } catch (e) { next(e); }
});
export default router;
