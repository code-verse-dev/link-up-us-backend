const { ApiResponse } = require("../helpers");
const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");

exports.adminRoute = async (req, res, next) => {
  const token =
    req.body?.token || req.query?.token || req.headers?.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json(ApiResponse({}, "Admin access required", false));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json(ApiResponse({}, "Admin access required", false));
    }
    const admin = await Admin.findById(decoded._id).select("-password -resetToken -resetTokenExpires");
    if (!admin) {
      return res.status(401).json(ApiResponse({}, "Unauthorized", false));
    }
    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json(ApiResponse({}, "Invalid or expired token", false));
  }
};
