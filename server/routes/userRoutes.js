import express from "express";
import upload, { handleUploadError } from "../middleware/uploadMiddleware.js";
import { getUserById , searchUsers , getSuggestedUsers , followUser , unfollowUser , getFollowers , getFollowing , updateProfile , updateProfilePicture} from "../controllers/userController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/search" , protect , searchUsers);
router.get("/suggestions", protect, getSuggestedUsers);
router.put("/profile", protect, updateProfile);
router.put(
  "/profile/picture",
  protect,
  upload.single("profilePic"),
  handleUploadError,
  updateProfilePicture
);
router.post("/:id/follow", protect, followUser);
router.delete("/:id/follow", protect, unfollowUser);

router.get("/:id", protect, getUserById);
router.get("/:id/followers", protect, getFollowers);
router.get("/:id/following", protect, getFollowing);

export default router;