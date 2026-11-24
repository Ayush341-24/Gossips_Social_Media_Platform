import jwt from "jsonwebtoken";
import User from "../models/User.js";

const optionalProtect = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) return next();

    const token = authorization.split(" ")[1];
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (user) req.user = user;
  } catch (error) {
    req.user = undefined;
  }

  next();
};

export default optionalProtect;
