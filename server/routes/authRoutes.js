import express from 'express';
import {register , login , logout , getProfile , updateProfile} from "../controllers/authController.js";
import protect from "../middlewares/authMiddleware.js"
const router = express.Router();

router.post("/register" , register);
router.post("/login" , login);
router.post("/logout",logout);
router.post("/getProfile" ,protect , getProfile);
router.put("/profile", protect, updateProfile);

export default router;