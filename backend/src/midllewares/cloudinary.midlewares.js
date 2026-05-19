import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const TEMP_DIR = path.join(process.cwd(), "public", "temp")

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TEMP_DIR)
  },
  filename: function (req, file, cb) {
    // Use a random filename with original extension to avoid path traversal and collisions
    const ext = path.extname(file.originalname) || ""
    const random = crypto.randomBytes(8).toString("hex")
    const filename = `${Date.now()}-${random}${ext}`
    cb(null, filename)
  }
})

const allowedMimeTypes = new Set([

  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",

  "video/mp4",
  "video/quicktime",
  "video/webm"
])

function fileFilter(req, file, cb) {
  if (allowedMimeTypes.has(file.mimetype)) return cb(null, true)
  cb(new Error("Invalid file type"), false)
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    // Allow larger uploads (e.g. up to 1 GB). Be cautious — this stores files on disk.
    // For production, consider direct-to-Cloudinary uploads or resumable uploads.
    fileSize: 1024 * 1024 * 1024 // 1 GB
  }
})