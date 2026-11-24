import mongoose from "mongoose";
import User from "../models/User.js";
import { uploadProfilePicture, deleteCloudinaryImage } from "../config/cloudinary.js";

const getSafeUser = (user) => ({
  _id: user._id,
  username: user.username,
  fullName: user.fullName,
  email: user.email,
  profilePic: user.profilePic,
  bio: user.bio,
  followers: user.followers,
  following: user.following,
});

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
  ) return null;
  return { page, limit };
};

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


// Get User By ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id).select("-password -profilePicPublicId");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const followersCount = user.followers.length;
    const followingCount = user.following.length;
    const isFollowing = Boolean(
      req.user &&
      user.followers.some((id) => id.toString() === req.user._id.toString())
    );
    const {
      followers,
      following,
      ...safeUser
    } = user.toObject();

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user: {
        ...safeUser,
        followersCount,
        followingCount,
        isFollowing,
      },
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Search Users
export const searchUsers = async (req, res) => {
  try {
    const query = typeof req.query.query === "string"
      ? req.query.query.trim()
      : "";
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }
    if (query.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search query must not exceed 100 characters",
      });
    }
    const pagination = parsePagination(req.query.page, req.query.limit);
    if (!pagination) {
      return res.status(400).json({
        success: false,
        message: `page must be a positive integer and limit must be between 1 and ${MAX_LIMIT}`,
      });
    }

    const pattern = escapeRegex(query);
    const filter = {
      $or: [
        { username: { $regex: pattern, $options: "i" } },
        { fullName: { $regex: pattern, $options: "i" } },
      ],
    };
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select("_id username fullName profilePic followers following")
        .sort({ username: 1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    const followingIds = new Set(
      (req.user.following || []).map((id) => id.toString())
    );
    const formattedUsers = users.map((user) => ({
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      profilePic: user.profilePic,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      isFollowing: followingIds.has(user._id.toString()),
    }));
    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users: formattedUsers,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const followUser = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.id;

    if (!mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    if (currentUserId.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const alreadyFollowing = await User.exists({
      _id: currentUserId,
      following: targetUserId,
    });
    if (alreadyFollowing) {
      return res.status(409).json({
        success: false,
        message: "User is already followed",
      });
    }

    await Promise.all([
      User.updateOne(
        { _id: currentUserId },
        { $addToSet: { following: targetUserId } }
      ),
      User.updateOne(
        { _id: targetUserId },
        { $addToSet: { followers: currentUserId } }
      ),
    ]);

    const [currentUser, updatedTarget] = await Promise.all([
      User.findById(currentUserId).select("following"),
      User.findById(targetUserId).select("followers"),
    ]);

    return res.status(200).json({
      success: true,
      message: "User followed successfully",
      followingCount: currentUser.following.length,
      followersCount: updatedTarget.followers.length,
      isFollowing: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.id;
    if (!mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    if (currentUserId.toString() === targetUserId) {
      return res.status(400).json({ success: false, message: "You cannot unfollow yourself" });
    }

    const isFollowing = await User.exists({
      _id: currentUserId,
      following: targetUserId,
    });
    if (!isFollowing) {
      const targetExists = await User.exists({ _id: targetUserId });
      if (!targetExists) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      return res.status(409).json({
        success: false,
        message: "User is not followed",
      });
    }

    await Promise.all([
      User.updateOne(
        { _id: currentUserId },
        { $pull: { following: targetUserId } }
      ),
      User.updateOne(
        { _id: targetUserId },
        { $pull: { followers: currentUserId } }
      ),
    ]);

    const [currentUser, updatedTarget] = await Promise.all([
      User.findById(currentUserId).select("following"),
      User.findById(targetUserId).select("followers"),
    ]);

    return res.status(200).json({
      success: true,
      message: "User unfollowed successfully",
      followingCount: currentUser.following.length,
      followersCount: updatedTarget.followers.length,
      isFollowing: false,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const pagination = parsePagination(req.query.page, req.query.limit);
    if (!pagination) {
      return res.status(400).json({
        success: false,
        message: `page must be a positive integer and limit must be between 1 and ${MAX_LIMIT}`,
      });
    }

    const currentUser = await User.findById(req.user._id)
      .select("following");
    const followingIds = currentUser.following || [];
    const excludedIds = [
      req.user._id,
      ...followingIds,
    ];

    const mutualCandidates = followingIds.length
      ? await User.find({
          _id: { $nin: excludedIds },
          followers: { $in: followingIds },
        })
          .select("_id")
          .limit(100)
      : [];

    const candidates = new Map(
      mutualCandidates.map((user) => [user._id.toString(), user])
    );

    if (candidates.size < pagination.limit) {
      const fallback = await User.find({
        _id: { $nin: excludedIds },
      })
        .select("_id")
        .sort({ _id: -1 })
        .limit(100);

      for (const user of fallback) {
        candidates.set(user._id.toString(), user);
        if (candidates.size >= 100) break;
      }
    }

    const candidateIds = [...candidates.keys()].map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const [users, totalUsers] = await Promise.all([
      User.find({ _id: { $in: candidateIds } })
        .select("_id username fullName profilePic followers")
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({ _id: { $in: candidateIds } }),
    ]);
    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      success: true,
      users: users.map((user) => ({
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        profilePic: user.profilePic,
        followersCount: user.followers.length,
        isFollowing: false,
      })),
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const getFollowers = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    const pagination = parsePagination(req.query.page, req.query.limit);
    if (!pagination) {
      return res.status(400).json({
        success: false,
        message: `page must be a positive integer and limit must be between 1 and ${MAX_LIMIT}`,
      });
    }

    const user = await User.findById(req.params.id).select("followers");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { page, limit } = pagination;
    const ids = user.followers.slice((page - 1) * limit, page * limit);
    const followers = await User.find({ _id: { $in: ids } })
      .select("username fullName profilePic");
    const totalPages = Math.ceil(user.followers.length / limit);

    return res.status(200).json({
      success: true,
      followers,
      count: user.followers.length,
      pagination: {
        page,
        limit,
        totalItems: user.followers.length,
        totalPages,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const getFollowing = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    const pagination = parsePagination(req.query.page, req.query.limit);
    if (!pagination) {
      return res.status(400).json({
        success: false,
        message: `page must be a positive integer and limit must be between 1 and ${MAX_LIMIT}`,
      });
    }

    const user = await User.findById(req.params.id).select("following");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { page, limit } = pagination;
    const ids = user.following.slice((page - 1) * limit, page * limit);
    const following = await User.find({ _id: { $in: ids } })
      .select("username fullName profilePic");
    const totalPages = Math.ceil(user.following.length / limit);

    return res.status(200).json({
      success: true,
      following,
      count: user.following.length,
      pagination: {
        page,
        limit,
        totalItems: user.following.length,
        totalPages,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, bio, website, gender } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (website !== undefined) user.website = website;
    if (gender) user.gender = gender;

    await user.save();

    const { followers, following, ...safeUser } = user.toObject();
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        ...safeUser,
        followersCount: followers.length,
        followingCount: following.length,
        isFollowing: false,
      },
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded. Select a profile picture.",
      });
    }

    if (!Buffer.isBuffer(req.file.buffer) || req.file.buffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid image buffer",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let uploadResult;
    try {
      uploadResult = await uploadProfilePicture(req.file.buffer);
    } catch (error) {
      console.error("Cloudinary profile picture upload failed:", error.message);
      return res.status(502).json({
        success: false,
        message: "Cloudinary upload failed",
      });
    }

    const previousPublicId = user.profilePicPublicId;

    user.profilePic = uploadResult.secureUrl;
    user.profilePicPublicId = uploadResult.publicId;

    try {
      await user.save();
    } catch (error) {
      try {
        await deleteCloudinaryImage(uploadResult.publicId);
      } catch (cleanupError) {
        console.error("Failed to delete newly uploaded image:", cleanupError.message);
      }
      console.error("MongoDB profile picture update failed:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to update profile picture",
      });
    }

    if (previousPublicId && previousPublicId !== uploadResult.publicId) {
      try {
        await deleteCloudinaryImage(previousPublicId);
      } catch (error) {
        console.error("Failed to delete previous Cloudinary image:", error.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      user: getSafeUser(user),
    });

  } catch (error) {
    console.error("Unexpected profile picture update error:", error.message);
    res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};