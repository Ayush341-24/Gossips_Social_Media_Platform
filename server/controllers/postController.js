import mongoose from "mongoose";
import Post from "../models/Post.js";
import User from "../models/User.js";
import {
  uploadPostImage,
  deleteCloudinaryImage,
} from "../config/cloudinary.js";

const AUTHOR_FIELDS = "username fullName profilePic";
const MAX_LIMIT = 50;

const parsePagination = (pageValue, limitValue) => {
  const page = pageValue === undefined ? 1 : Number(pageValue);
  const limit = limitValue === undefined ? 10 : Number(limitValue);

  if (
    !Number.isInteger(page) ||
    !Number.isInteger(limit) ||
    page < 1 ||
    limit < 1 ||
    limit > MAX_LIMIT
  ) {
    return null;
  }

  return { page, limit };
};

export const createPost = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    if (!Buffer.isBuffer(req.file.buffer) || req.file.buffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid image buffer",
      });
    }

    const caption = typeof req.body.caption === "string"
      ? req.body.caption.trim()
      : "";

    if (caption.length > 2200) {
      return res.status(400).json({
        success: false,
        message: "Caption must not exceed 2200 characters",
      });
    }

    let uploadResult;
    try {
      uploadResult = await uploadPostImage(req.file.buffer);
    } catch (error) {
      console.error("Cloudinary post upload failed:", error.message);
      return res.status(502).json({
        success: false,
        message: "Cloudinary upload failed",
      });
    }

    try {
      const post = await Post.create({
        author: req.user._id,
        caption,
        image: uploadResult.secureUrl,
        imagePublicId: uploadResult.publicId,
      });

      await post.populate("author", AUTHOR_FIELDS);

      return res.status(201).json({
        success: true,
        message: "Post created successfully",
        post,
      });
    } catch (error) {
      try {
        await deleteCloudinaryImage(uploadResult.publicId);
      } catch (cleanupError) {
        console.error("Failed to delete uploaded post image:", cleanupError.message);
      }
      console.error("MongoDB post creation failed:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to create post",
      });
    }
  } catch (error) {
    console.error("Unexpected post creation error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const pagination = parsePagination(req.query.page, req.query.limit);
    if (!pagination) {
      return res.status(400).json({
        success: false,
        message: `page must be a positive integer and limit must be between 1 and ${MAX_LIMIT}`,
      });
    }

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const [posts, totalPosts] = await Promise.all([
      Post.find()
        .populate("author", AUTHOR_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalPosts / limit);

    return res.status(200).json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        totalPosts,
        totalPages,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Unexpected get posts error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const getPostById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    const post = await Post.findById(req.params.id)
      .populate("author", AUTHOR_FIELDS);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    return res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    console.error("Unexpected get post error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const pagination = parsePagination(req.query.page, req.query.limit);
    if (!pagination) {
      return res.status(400).json({
        success: false,
        message: `page must be a positive integer and limit must be between 1 and ${MAX_LIMIT}`,
      });
    }

    const user = await User.findById(userId).select("_id");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const [posts, totalPosts] = await Promise.all([
      Post.find({ author: userId })
        .populate("author", AUTHOR_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments({ author: userId }),
    ]);

    const totalPages = Math.ceil(totalPosts / limit);

    return res.status(200).json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        totalPosts,
        totalPages,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Unexpected get user posts error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const likeUnlikePost = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid post ID" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const userId = req.user._id;
    const isLiked = post.likes.some((id) => id.toString() === userId.toString());

    if (isLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }

    await post.save();

    return res.status(200).json({
      success: true,
      message: isLiked ? "Post unliked" : "Post liked",
      likes: post.likes.length,
    });
  } catch (error) {
    console.error("Unexpected like/unlike error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const addComment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid post ID" });
    }

    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    post.comments.push({ user: req.user._id, text: text.trim() });
    await post.save();
    await post.populate("comments.user", "username fullName profilePic");

    return res.status(200).json({
      success: true,
      message: "Comment added successfully",
      comments: post.comments,
    });
  } catch (error) {
    console.error("Unexpected comment error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this post",
      });
    }

    try {
      await post.deleteOne();
    } catch (error) {
      console.error("MongoDB post deletion failed:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to delete post",
      });
    }

    if (post.imagePublicId) {
      try {
        await deleteCloudinaryImage(post.imagePublicId);
      } catch (error) {
        console.error("Failed to delete Cloudinary post image:", error.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Unexpected post deletion error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};
