import express from "express";
import { getUserById , searchUsers} from "../controllers/userController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/search" , protect , searchUsers);
router.get("/:id", protect, getUserById);


export default router;