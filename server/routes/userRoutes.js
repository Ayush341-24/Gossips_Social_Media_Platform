import express from "express";
import upload, { handleUploadError } from "../middleware/uploadMiddleware.js";
import { getUserById , searchUsers , followUnfollowUser , getFollowers , getFollowing , updateProfile , updateProfilePicture} from "../controllers/userController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/search" , protect , searchUsers);
router.put("/profile", protect, updateProfile);
router.put(
  "/profile/picture",
  protect,
  upload.single("profilePic"),
  handleUploadError,
  updateProfilePicture
);

router.get("/:id", protect, getUserById);
router.put("/:id/follow", protect, followUnfollowUser);
router.get("/:id/followers", protect, getFollowers);
router.get("/:id/following", protect, getFollowing);

export default router;