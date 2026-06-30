import multer from "multer";

// Store uploaded files temporarily in memory
const storage = multer.memoryStorage();

// Accept only image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
});

export default upload;