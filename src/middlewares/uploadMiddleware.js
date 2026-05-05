const multer = require("multer");
const path = require("path");

// izin verilen tipler
const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];

// ⚠️ EN ÖNEMLİ KISIM → memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedMimeTypes.includes(file.mimetype) || !allowedExt.includes(ext)) {
    return cb(new Error("Sadece jpg, jpeg, png, webp yüklenebilir."));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10,
  },
});

module.exports = upload;