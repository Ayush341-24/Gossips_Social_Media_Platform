import express from "express";
import protect from "../middleware/authMiddleware.js";
import upload, { handleUploadError } from "../middleware/uploadMiddleware.js";
import optionalProtect from "../middleware/optionalAuthMiddleware.js";
import {
  createPost,
  getAllPosts,
  getPostById,
  getPostsByUser,
  getPersonalizedFeed,
  getExploreFeed,
  likePost,
  unlikePost,
  addComment,
  getComments,
  deleteComment,
  savePost,
  unsavePost,
  getSavedPosts,
  deletePost,
} from "../controllers/postController.js";

const router = express.Router();

router.post("/", protect, upload.single("image"), handleUploadError, createPost);
router.get("/", optionalProtect, getAllPosts);
router.get("/feed", protect, getPersonalizedFeed);
router.get("/explore", optionalProtect, getExploreFeed);
router.get("/saved", protect, getSavedPosts);
router.get("/user/:userId", optionalProtect, getPostsByUser);
router.get("/:id", optionalProtect, getPostById);
router.post("/:id/like", protect, likePost);
router.delete("/:id/like", protect, unlikePost);
router.post("/:id/save", protect, savePost);
router.delete("/:id/save", protect, unsavePost);
router.post("/:id/comments", protect, addComment);
router.get("/:id/comments", getComments);
router.delete("/:id/comments/:commentId", protect, deleteComment);
router.delete("/:id", protect, deletePost);

export default router;