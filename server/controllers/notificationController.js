import mongoose from "mongoose";
import Notification from "../models/Notification.js";

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

export const getNotifications = async (req, res) => {
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
    const [notifications, totalNotifications] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .populate("sender", "username fullName profilePic")
        .populate("post", "_id image caption createdAt")
        .populate("comment", "_id text createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ recipient: req.user._id }),
    ]);
    const totalPages = Math.ceil(totalNotifications / limit);

    return res.status(200).json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        totalNotifications,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Unexpected get notifications error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });
    return res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("Unexpected unread count error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID" });
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { isRead: true } },
      { new: true }
    )
      .populate("sender", "username fullName profilePic")
      .populate("post", "_id image caption createdAt")
      .populate("comment", "_id text createdAt");

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Unexpected mark notification error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    return res.status(200).json({
      success: true,
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Unexpected mark all notifications error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID" });
    }
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Unexpected delete notification error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred",
    });
  }
};
