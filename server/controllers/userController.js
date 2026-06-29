import User from "../models/User.js";

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