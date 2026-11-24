export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body",
    });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate resource",
    });
  }

  if (err?.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Invalid request data",
    });
  }

  console.error("Unhandled application error:", err?.message || "Unknown error");
  return res.status(500).json({
    success: false,
    message: "An unexpected server error occurred",
  });
};
