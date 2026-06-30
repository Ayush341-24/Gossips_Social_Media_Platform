import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";

connectDB();

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users" , userRoutes);
app.use("/api/posts" , postRoutes);

app.get("/", (req, res) => {
  res.send("<h1>Welcome to Gossips API</h1>");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Running on port ${PORT}`);
});