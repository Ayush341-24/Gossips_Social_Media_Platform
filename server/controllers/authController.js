import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import generateToken from "../utils/generateToken.js";


export const register = async (req , res) => {
    try{
        const {username , fullName , email , password} = req.body;
        if(!username || !fullName || !email || !password){
            return res.status(400).json({
                message : "Please fill all the fields",
            });
        }

        const existingUser = await User.findOne({
            $or : [{email} , {username}]
        });
        if(existingUser){
            return res.status(400).json({
                message : "User already exists",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password , salt);

        const newUser = await User.create({
            username , 
            fullName ,
            email ,
            password : hashedPassword,
        });

        const token = generateToken(newUser._id);

        const userResponse = {
            id : newUser._id,
            username: newUser.username,
            fullName: newUser.fullName,
            email: newUser.email,
            profilePic: newUser.profilePic,
            bio: newUser.bio,
            followers: newUser.followers,
            following: newUser.following,
        }

        res.status(201).json({
            message : "User registered successfully",
            token,
            user : userResponse,
        });
    }
    catch(error){
        res.status(500).json({
            message : error.message,
        });
    }
};

export const login = async (req , res) => {
    try{
        res.status(200).json({
            message : "Login route Working",
        });
    }
    catch(error){
        res.status(500).json({
            message : error.message,
        });
    }
};
export const logout = async (req , res) => {
    try{
        res.status(200).json({
            message : "Logout Successful",
        });
    }
    catch(error){
        res.status(500).json({
            message : error.message,
        });
    }
};
export const getProfile = async (req , res) => {
    try{
        res.status(200).json({
            message : "Profile route Working",
        });
    }
    catch(error){
        res.status(500).json({
            message : error.message,
        });
    }
};

