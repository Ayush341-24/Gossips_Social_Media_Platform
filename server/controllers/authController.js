import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import generateToken from "../utils/generateToken.js";

// register api
export const register = async (req, res) => {
    try {
        const { username, fullName, email, password } = req.body;
        if (!username || !fullName || !email || !password) {
            return res.status(400).json({
                message: "Please fill all the fields",
            });
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });
        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            username,
            fullName,
            email,
            password: hashedPassword,
        });

        const token = generateToken(newUser._id);

        const userResponse = {
            id: newUser._id,
            username: newUser.username,
            fullName: newUser.fullName,
            email: newUser.email,
            profilePic: newUser.profilePic,
            bio: newUser.bio,
            followers: newUser.followers,
            following: newUser.following,
        }

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: userResponse,
        });
    }
    catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// login api
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please fill all the fields",
            });
        }
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );
        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid Credentials",
            });
        }
        // Generate JWT
        const token = generateToken(user._id);

        // Safe User Response
        const userResponse = {
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
        };

        res.status(200).json({
            message: "Login successful",
            token,
            user: userResponse,
        });
    }
    catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// logout api
export const logout = async (req, res) => {
    try {
        res.status(200).json({
            message: "Logout Successful",
        });
    }
    catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
// Get Current User Profile
export const getProfile = async (req, res) => {
  try {
    res.status(200).json({
      message: "Profile fetched successfully",
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Update Profile API
export const updateProfile = async (req, res) => {
  try {
    const { fullName, bio, profilePic } = req.body;

    // Find logged-in user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Update only provided fields
    if (fullName) user.fullName = fullName;
    if (bio) user.bio = bio;
    if (profilePic) user.profilePic = profilePic;

    // Save changes
    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

