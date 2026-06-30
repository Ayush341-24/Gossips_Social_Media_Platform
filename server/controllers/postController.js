import Post from "../models/Post.js";
import cloudinary from "../config/cloudinary.js";

export const createPost = async (req, res) => {
    try {
        const { caption } = req.body;

        if (!req.file) {
            return res.status(400).json({
                message: "Image is required",
            });
        }

        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(
            `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
            {
                folder: "gossips_posts",
            }
        );

        // Create post
        const post = await Post.create({
            user: req.user.id,
            caption,
            image: result.secure_url,
        });

        res.status(201).json({
            success: true,
            message: "Post created successfully",
            post,
        });
    }
    catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}