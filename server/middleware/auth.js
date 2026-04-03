// ============================================================
// JWT Authentication Middleware
// Verifies JWT token from HTTP-only cookies
// Attaches decoded user data to req.user
// ============================================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const verifyToken = async (req, res, next) => {
  try {
    // Extract token from HTTP-only cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No authentication token provided.",
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user and attach to request (exclude password)
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Token may be invalid.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please log in again.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error during authentication.",
    });
  }
};

module.exports = verifyToken;
