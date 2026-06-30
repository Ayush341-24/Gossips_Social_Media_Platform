import express from "express";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import { createPost } from "../controllers/postController.js";

const router = express.Router();

// Create Post
router.post("/", protect, upload.single("image"), createPost);

export default router;