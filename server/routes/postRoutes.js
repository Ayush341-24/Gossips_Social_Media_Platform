import express from "express";
import protect from "../middleware/authMiddleware.js";
import upload, { handleUploadError } from "../middleware/uploadMiddleware.js";
import {
  createPost,
  getAllPosts,
  getPostById,
  getPostsByUser,
  likeUnlikePost,
  addComment,
  deletePost,
} from "../controllers/postController.js";

const router = express.Router();

router.post("/", protect, upload.single("image"), handleUploadError, createPost);
router.get("/", getAllPosts);
router.get("/user/:userId", getPostsByUser);
router.get("/:id", getPostById);
router.put("/:id/like", protect, likeUnlikePost);
router.post("/:id/comment", protect, addComment);
router.delete("/:id", protect, deletePost);

export default router;