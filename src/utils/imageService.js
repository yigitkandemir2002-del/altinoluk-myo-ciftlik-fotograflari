const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const uploadsRoot = path.join(process.cwd(), "uploads");
const originalsDir = path.join(uploadsRoot, "originals");
const thumbsDir = path.join(uploadsRoot, "thumbs");

for (const dir of [uploadsRoot, originalsDir, thumbsDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function buildFileBaseName(originalName = "image") {
  const safeBase =
    path
      .basename(originalName, path.extname(originalName))
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "image";

  return `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}`;
}

async function saveImageVersions(file) {
  const baseName = buildFileBaseName(file.originalname);

  const largeFileName = `${baseName}.webp`;
  const thumbFileName = `${baseName}-thumb.webp`;

  const largePath = path.join(originalsDir, largeFileName);
  const thumbPath = path.join(thumbsDir, thumbFileName);

  await sharp(file.buffer)
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toFile(largePath);

  await sharp(file.buffer)
    .rotate()
    .resize({
      width: 500,
      height: 500,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 72 })
    .toFile(thumbPath);

  return {
    imageUrl: `/uploads/originals/${largeFileName}`,
    thumbUrl: `/uploads/thumbs/${thumbFileName}`,
  };
}

function deleteImageIfExists(publicUrl) {
  if (!publicUrl) return;

  const relativePath = publicUrl.replace(/^\/uploads\//, "");
  const fullPath = path.join(uploadsRoot, relativePath);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

module.exports = {
  saveImageVersions,
  deleteImageIfExists,
};