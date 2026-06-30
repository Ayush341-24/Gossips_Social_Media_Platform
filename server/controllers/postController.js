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

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "username profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const likeUnlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const userId = req.user._id;

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );

      await post.save();

      return res.status(200).json({
        success: true,
        message: "Post unliked",
        likes: post.likes.length,
      });
    }

    post.likes.push(userId);

    await post.save();

    res.status(200).json({
      success: true,
      message: "Post liked",
      likes: post.likes.length,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = {
      user: req.user._id,
      text,
    };

    post.comments.push(comment);

    await post.save();

    await post.populate("comments.user", "username profilePicture");

    res.status(200).json({
      success: true,
      message: "Comment added successfully",
      comments: post.comments,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check ownership
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this post",
      });
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};