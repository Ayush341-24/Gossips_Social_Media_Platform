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


// Get User By ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User fetched successfully",
      user,
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
    const { query } = req.query;

    // Check if query is provided
    if (!query) {
      return res.status(400).json({
        message: "Search query is required",
      });
    }

    // Find matching users
    const users = await User.find({
      username: {
        $regex: query,
        $options: "i",
      },
    }).select("-password");

    res.status(200).json({
      message: "Users fetched successfully",
      users,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.id;

    // Prevent following yourself
    if (currentUserId.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);

      await currentUser.save();
      await targetUser.save();

      return res.status(200).json({
        success: true,
        message: "User unfollowed successfully",
      });
    }

    // Follow
    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: "User followed successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("followers", "username profilePicture");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      count: user.followers.length,
      followers: user.followers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("following", "username profilePicture");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      count: user.following.length,
      following: user.following,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
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