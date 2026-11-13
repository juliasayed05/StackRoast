import multer from "multer";
import AppError from "../utils/AppError.js";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024, // Maximum 5 MB
    files: 1,
  },

  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(
        new AppError("Only JPG, PNG and WebP images are allowed.", 400),
      );
    }

    callback(null, true);
  },
});

export default upload;
