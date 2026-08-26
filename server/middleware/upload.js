// ============================================================
// middleware/upload.js
// Configures multer (file upload library) used by routes that
// accept files like photos, documents and syllabus PDFs.
// Files are saved on disk inside the uploads/ folder.
// ============================================================
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Storage engine
const storage = multer.diskStorage({
  // Pick the subfolder based on the form field name of the file
  destination: (req, file, cb) => {
    let folder = "uploads/";
    if (file.fieldname === "photo") folder = "uploads/photos/";
    else if (file.fieldname === "document") folder = "uploads/documents/";
    else if (file.fieldname === "syllabus") folder = "uploads/syllabus/";
    else if (file.fieldname === "attachment") folder = "uploads/notices/";

    ensureDir(folder);
    cb(null, folder);
  },
  // Rename the file so two uploads never overwrite each other:
  // e.g. photo-1690000000-123456789.jpg
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter
// Only allow safe document/image types (checked by extension AND mimetype)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xlsx|zip/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error("Invalid file type. Only images, PDFs, and documents allowed."));
};

// Final multer instance shared by all routes; max size 10MB per file
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = upload;
