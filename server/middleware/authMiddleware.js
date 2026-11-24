import jwt from 'jsonwebtoken';
import User from '../models/User.js';


const protect = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;

        if (!authorization || !authorization.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is required",
            });
        }
        const jwtToken = authorization.split(" ")[1];
        if (!jwtToken) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is required",
            });
        }
        const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");
        // Check if user exists
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

export default protect;