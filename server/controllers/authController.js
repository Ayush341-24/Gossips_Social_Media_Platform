import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import generateToken from "../utils/generateToken.js";

// register api
export const register = async (req, res) => {
    try {
        const body = req.body || {};
        const username = typeof body.username === "string" ? body.username.trim() : "";
        const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const password = typeof body.password === "string" ? body.password : "";
        if (!username || !fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields",
            });
        }
        if (!/^[A-Za-z0-9_.]{3,20}$/.test(username)) {
            return res.status(400).json({
                success: false,
                message: "Username must contain 3-20 letters, numbers, underscores, or dots",
            });
        }
        if (fullName.length > 50) {
            return res.status(400).json({ success: false, message: "Full name must not exceed 50 characters" });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }
        if (password.length < 6 || password.length > 128) {
            return res.status(400).json({ success: false, message: "Password must be between 6 and 128 characters" });
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
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
            success: true,
            message: "User registered successfully",
            token,
            user: userResponse,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Registration failed",
        });
    }
};

// login api
export const login = async (req, res) => {
    try {
        const body = req.body || {};
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const password = typeof body.password === "string" ? body.password : "";

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields",
            });
        }
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );
        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
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
            success: true,
            message: "Login successful",
            token,
            user: userResponse,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Login failed",
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
            success: false,
            message: "Logout failed",
        });
    }
};
// Get Current User Profile
export const getProfile = async (req, res) => {
  try {
    const userObject = req.user.toObject ? req.user.toObject() : req.user;
    const { password, profilePicPublicId, followers, following, ...safeUser } = userObject;
    res.status(200).json({
      message: "Profile fetched successfully",
      user: {
        ...safeUser,
        followersCount: followers?.length || 0,
        followingCount: following?.length || 0,
        isFollowing: false,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch profile",
    });
  }
};

// Update Profile API
export const updateProfile = async (req, res) => {
  try {
    const body = req.body || {};
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : undefined;
    const bio = typeof body.bio === "string" ? body.bio.trim() : undefined;

    if (fullName !== undefined && fullName.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Full name must not exceed 50 characters",
      });
    }
    if (bio !== undefined && bio.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Bio must not exceed 150 characters",
      });
    }

    // Find logged-in user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Update only provided fields
    if (fullName !== undefined) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;

    // Save changes
    await user.save();

    const userObject = user.toObject();
    const {
      password,
      profilePicPublicId,
      followers,
      following,
      ...safeUser
    } = userObject;
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        ...safeUser,
        followersCount: followers.length,
        followingCount: following.length,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Profile update failed",
    });
  }
};

