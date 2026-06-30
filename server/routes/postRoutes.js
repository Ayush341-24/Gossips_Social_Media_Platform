import express from "express";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import { createPost , getAllPosts , likeUnlikePost , addComment , deletePost} from "../controllers/postController.js";

const router = express.Router();

// Create Post
router.post("/", protect, upload.single("image"), createPost);
router.get("/" , protect , getAllPosts);
router.put("/:id/like", protect, likeUnlikePost);
router.post("/:id/comment", protect, addComment);
router.delete("/:id", protect, deletePost);

export default router;