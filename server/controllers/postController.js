import mongoose from "mongoose";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import Notification from "../models/Notification.js";
import SavedPost from "../models/SavedPost.js";
import { isValidImageBuffer } from "../middleware/uploadMiddleware.js";
import {
  uploadPostImage,
  deleteCloudinaryImage,
} from "../config/cloudinary.js";

const AUTHOR_FIELDS = "username fullName profilePic";
const MAX_LIMIT = 50;

const formatPost = (post, currentUserId = null, commentCount = 0, savedPostIds = new Set()) => {
  const result = typeof post.toObject === "function" ? post.toObject() : { ...post };
  const likes = Array.isArray(result.likes) ? result.likes : [];
  return {
    ...result,
    likeCount: likes.length,
    isLikedByCurrentUser: Boolean(
      currentUserId &&
      likes.some((id) => id.toString() === currentUserId.toString())
    ),
    commentCount,
    isSavedByCurrentUser: Boolean(
      currentUserId &&
      savedPostIds.has(post._id.toString())
    ),
  };
};

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

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getFormattedPostPage = async ({
  filter,
  page,
  limit,
  currentUserId,
}) => {
  const skip = (page - 1) * limit;
  const [posts, totalPosts] = await Promise.all([
    Post.find(filter)
      .select("_id image caption author likes createdAt updatedAt")
      .populate("author", AUTHOR_FIELDS)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Post.countDocuments(filter),
  ]);

  const commentCounts = posts.length
    ? await Comment.aggregate([
        { $match: { post: { $in: posts.map((post) => post._id) } } },
        { $group: { _id: "$post", count: { $sum: 1 } } },
      ])
    : [];
  const countByPost = new Map(
    commentCounts.map((item) => [item._id.toString(), item.count])
  );
  const savedPosts = currentUserId && posts.length
    ? await SavedPost.find({
        user: currentUserId,
        post: { $in: posts.map((post) => post._id) },
      }).select("post").lean()
    : [];
  const savedPostIds = new Set(
    savedPosts.map((saved) => saved.post.toString())
  );
  const formattedPosts = posts.map((post) =>
    formatPost(
      post,
      currentUserId,
      countByPost.get(post._id.toString()) || 0,
      savedPostIds
    )
  );

  const totalPages = Math.ceil(totalPosts / limit);
  return {
    posts: formattedPosts,
    pagination: {
      page,
      limit,
      totalPosts,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
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
    if (!isValidImageBuffer(req.file.buffer)) {
      return res.status(400).json({
        success: false,
        message: "The uploaded file is not a valid JPEG, PNG, or WebP image",
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
      const commentCount = await Comment.countDocuments({ post: post._id });

      return res.status(201).json({
        success: true,
        message: "Post created successfully",
        post: formatPost(post, req.user._id, commentCount),
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
    const commentCounts = await Comment.aggregate([
      { $match: { post: { $in: posts.map((post) => post._id) } } },
      { $group: { _id: "$post", count: { $sum: 1 } } },
    ]);
    const countByPost = new Map(
      commentCounts.map((item) => [item._id.toString(), item.count])
    );
    const savedRecords = req.user
      ? await SavedPost.find({
          user: req.user._id,
          post: { $in: posts.map((post) => post._id) },
        }).select("post").lean()
      : [];
    const savedPostIds = new Set(
      savedRecords.map((saved) => saved.post.toString())
    );
    const formattedPosts = posts.map((post) =>
      formatPost(
        post,
        req.user?._id,
        countByPost.get(post._id.toString()) || 0,
        savedPostIds
      )
    );

    return res.status(200).json({
      success: true,
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        totalPosts,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
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
    const commentCount = await Comment.countDocuments({ post: post._id });
    const isSaved = req.user
      ? await SavedPost.exists({ user: req.user._id, post: post._id })
      : null;
    const savedPostIds = new Set(isSaved ? [post._id.toString()] : []);

    return res.status(200).json({
      success: true,
      post: formatPost(post, req.user?._id, commentCount, savedPostIds),
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
    const commentCounts = await Comment.aggregate([
      { $match: { post: { $in: posts.map((post) => post._id) } } },
      { $group: { _id: "$post", count: { $sum: 1 } } },
    ]);
    const countByPost = new Map(
      commentCounts.map((item) => [item._id.toString(), item.count])
    );
    const savedRecords = req.user
      ? await SavedPost.find({
          user: req.user._id,
          post: { $in: posts.map((post) => post._id) },
        }).select("post").lean()
      : [];
    const savedPostIds = new Set(
      savedRecords.map((saved) => saved.post.toString())
    );
    const formattedPosts = posts.map((post) =>
      formatPost(
        post,
        req.user?._id,
        countByPost.get(post._id.toString()) || 0,
        savedPostIds
      )
    );

    return res.status(200).json({
      success: true,
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        totalPosts,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        hasPreviousPage: page > 1,
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

export const likePost = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid post ID" });
    }

    const userId = req.user._id;
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, likes: { $ne: userId } },
      { $addToSet: { likes: userId } },
      { new: true }
    );

    if (!post) {
      const exists = await Post.exists({ _id: req.params.id });
      if (!exists) {
        return res.status(404).json({ success: false, message: "Post not found" });
      }
      const likedPost = await Post.findById(req.params.id);
      return res.status(409).json({
        success: false,
        message: "Post is already liked",
        likeCount: likedPost.likes.length,
        isLikedByCurrentUser: true,
      });
    }

    if (post.author.toString() !== userId.toString()) {
      try {
        const alreadyExists = await Notification.exists({
          recipient: post.author,
          sender: userId,
          type: "like",
          post: post._id,
        });
        if (!alreadyExists) {
          await Notification.create({
            recipient: post.author,
            sender: userId,
            type: "like",
            post: post._id,
            message: "liked your post",
          });
        }
      } catch (notificationError) {
        console.error("Failed to create like notification:", notificationError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Post liked",
      likeCount: post.likes.length,
      isLikedByCurrentUser: true,
    });
  } catch (error) {
    console.error("Unexpected like error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const unlikePost = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid post ID" });
    }

    const userId = req.user._id;
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, likes: userId },
      { $pull: { likes: userId } },
      { new: true }
    );

    if (!post) {
      const exists = await Post.exists({ _id: req.params.id });
      if (!exists) {
        return res.status(404).json({ success: false, message: "Post not found" });
      }
      const unlikedPost = await Post.findById(req.params.id);
      return res.status(409).json({
        success: false,
        message: "Post is not liked",
        likeCount: unlikedPost.likes.length,
        isLikedByCurrentUser: false,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post unliked",
      likeCount: post.likes.length,
      isLikedByCurrentUser: false,
    });
  } catch (error) {
    console.error("Unexpected unlike error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const savePost = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid post ID" });
    }

    const post = await Post.findById(req.params.id).select("_id");
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const existing = await SavedPost.findOne({
      user: req.user._id,
      post: post._id,
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Post is already saved",
      });
    }

    await SavedPost.create({ user: req.user._id, post: post._id });
    return res.status(201).json({
      success: true,
      message: "Post saved successfully",
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Post is already saved",
      });
    }
    console.error("Unexpected save post error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const unsavePost = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid post ID" });
    }

    const post = await Post.findById(req.params.id).select("_id");
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const deleted = await SavedPost.findOneAndDelete({
      user: req.user._id,
      post: post._id,
    });
    if (!deleted) {
      return res.status(409).json({
        success: false,
        message: "Post is not saved",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post unsaved successfully",
    });
  } catch (error) {
    console.error("Unexpected unsave post error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const getSavedPosts = async (req, res) => {
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
    const [savedRecords, totalSavedPosts] = await Promise.all([
      SavedPost.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("post")
        .lean(),
      SavedPost.countDocuments({ user: req.user._id }),
    ]);
    const postIds = savedRecords.map((saved) => saved.post);
    const result = await getFormattedPostPage({
      filter: { _id: { $in: postIds } },
      ...pagination,
      currentUserId: req.user._id,
    });

    const postOrder = new Map(
      postIds.map((id, index) => [id.toString(), index])
    );
    result.posts.sort(
      (a, b) =>
        (postOrder.get(a._id.toString()) ?? 0) -
        (postOrder.get(b._id.toString()) ?? 0)
    );
    result.pagination.totalPosts = totalSavedPosts;
    result.pagination.totalPages = Math.ceil(totalSavedPosts / limit);
    result.pagination.hasNextPage =
      page < result.pagination.totalPages;
    result.pagination.hasPreviousPage = page > 1;

    return res.status(200).json({
      success: true,
      message: "Saved posts fetched successfully",
      ...result,
    });
  } catch (error) {
    console.error("Unexpected get saved posts error:", error.message);
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

    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }
    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Comment must not exceed 1000 characters",
      });
    }

    const post = await Post.findById(req.params.id).select("_id author");
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      text,
    });
    await comment.populate("author", "username fullName profilePic");
    const commentCount = await Comment.countDocuments({ post: post._id });

    if (post.author.toString() !== req.user._id.toString()) {
      try {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: "comment",
          post: post._id,
          comment: comment._id,
          message: "commented on your post",
        });
      } catch (notificationError) {
        console.error("Failed to create comment notification:", notificationError.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment,
      commentCount,
    });
  } catch (error) {
    console.error("Unexpected comment creation error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const getComments = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid post ID" });
    }

    const post = await Post.findById(req.params.id).select("_id");
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const pagination = parsePagination(req.query.page, req.query.limit);
    if (!pagination) {
      return res.status(400).json({
        success: false,
        message: `page must be a positive integer and limit must be between 1 and ${MAX_LIMIT}`,
      });
    }

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const [comments, commentCount] = await Promise.all([
      Comment.find({ post: post._id })
        .populate("author", "username fullName profilePic")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Comment.countDocuments({ post: post._id }),
    ]);
    const totalPages = Math.ceil(commentCount / limit);

    return res.status(200).json({
      success: true,
      comments,
      commentCount,
      pagination: {
        page,
        limit,
        totalPosts: commentCount,
        totalPages,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Unexpected get comments error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid post ID" });
    }
    if (!mongoose.isValidObjectId(req.params.commentId)) {
      return res.status(400).json({ success: false, message: "Invalid comment ID" });
    }

    const post = await Post.findById(req.params.id).select("_id");
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const comment = await Comment.findOne({
      _id: req.params.commentId,
      post: post._id,
    });
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found for this post",
      });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this comment",
      });
    }

    await comment.deleteOne();
    try {
      await Notification.deleteMany({ comment: comment._id });
    } catch (cleanupError) {
      console.error("Failed to clean comment notification:", cleanupError.message);
    }
    const commentCount = await Comment.countDocuments({ post: post._id });

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      commentCount,
    });
  } catch (error) {
    console.error("Unexpected comment deletion error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const getPersonalizedFeed = async (req, res) => {
  try {
    const pagination = parsePagination(req.query.page, req.query.limit);
    if (!pagination) {
      return res.status(400).json({
        success: false,
        message: `page must be a positive integer and limit must be between 1 and ${MAX_LIMIT}`,
      });
    }

    const currentUserId = req.user._id;
    const followingIds = Array.isArray(req.user.following)
      ? req.user.following
      : [];
    const authorIds = [...new Set([
      currentUserId.toString(),
      ...followingIds.map((id) => id.toString()),
    ])];

    const activeUsers = await User.find({ _id: { $in: authorIds } })
      .select("_id");
    const activeAuthorIds = activeUsers.map((user) => user._id);

    const result = await getFormattedPostPage({
      filter: { author: { $in: activeAuthorIds } },
      ...pagination,
      currentUserId,
    });

    return res.status(200).json({
      success: true,
      message: "Personalized feed fetched successfully",
      ...result,
    });
  } catch (error) {
    console.error("Unexpected personalized feed error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const getExploreFeed = async (req, res) => {
  try {
    const pagination = parsePagination(req.query.page, req.query.limit);
    if (!pagination) {
      return res.status(400).json({
        success: false,
        message: `page must be a positive integer and limit must be between 1 and ${MAX_LIMIT}`,
      });
    }

    const filter = {};
    if (req.user) {
      filter.author = { $ne: req.user._id };
    }

    if (req.query.author) {
      if (!mongoose.isValidObjectId(req.query.author)) {
        return res.status(400).json({
          success: false,
          message: "Invalid author ID",
        });
      }
      const author = await User.findById(req.query.author).select("_id");
      if (!author) {
        return res.status(404).json({
          success: false,
          message: "Author not found",
        });
      }
      filter.author = req.query.author;
    }

    if (req.query.query) {
      const keyword = req.query.query.trim();
      if (!keyword) {
        return res.status(400).json({
          success: false,
          message: "Search query cannot be empty",
        });
      }
      if (keyword.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Search query must not exceed 100 characters",
        });
      }
      filter.caption = { $regex: escapeRegex(keyword), $options: "i" };
    }

    const activeAuthorIds = await User.distinct("_id");
    if (req.query.author) {
      filter.author = req.query.author;
    } else if (req.user) {
      filter.author = {
        $in: activeAuthorIds.filter(
          (id) => id.toString() !== req.user._id.toString()
        ),
      };
    } else {
      filter.author = { $in: activeAuthorIds };
    }

    const result = await getFormattedPostPage({
      filter,
      ...pagination,
      currentUserId: req.user?._id,
    });

    return res.status(200).json({
      success: true,
      message: "Explore feed fetched successfully",
      ...result,
    });
  } catch (error) {
    console.error("Unexpected explore feed error:", error.message);
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

    const cleanupResults = await Promise.allSettled([
      Comment.deleteMany({ post: post._id }),
      SavedPost.deleteMany({ post: post._id }),
      Notification.deleteMany({ post: post._id }),
    ]);
    cleanupResults.forEach((result) => {
      if (result.status === "rejected") {
        console.error("Failed to clean post-related records:", result.reason?.message);
      }
    });

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
