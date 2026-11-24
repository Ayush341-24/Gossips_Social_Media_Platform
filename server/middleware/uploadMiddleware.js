import multer from "multer";

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const allowedExtensions = /\.(jpe?g|png|webp)$/i;

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.test(file.originalname)) {
    return cb(
      new multer.MulterError("LIMIT_UNEXPECTED_FILE", "profilePic"),
      false
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const handleUploadError = (error, req, res, next) => {
  if (!error) return next();

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "Uploaded image must not exceed 5 MB",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Only JPEG, PNG, and WebP image files are allowed",
      });
    }
  }

  return res.status(400).json({
    success: false,
    message: "Unable to process the uploaded file",
  });
};

export default upload;