const { ApiResponse } = require("../helpers");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

exports.userRoute = async (req, res, next) => {
  const token =
    req.body?.token || req.query?.token || req.headers?.authorization?.replace("Bearer ", "");
  const userId = req.headers["x-user-id"] || req.query?.userId;

  if (userId) {
    const user = await User.findById(userId).select("-password");
    if (user) {
      req.user = user;
      return next();
    }
  }

  if (!token) {
    return res.status(403).json(ApiResponse({}, "Access forbidden", false));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id).select("-password");
    if (!user) {
      return res.status(401).json(ApiResponse({}, "Unauthorized", false));
    }
    req.user = user;
    req.userToken = token;
    next();
  } catch (err) {
    return res.status(401).json(ApiResponse({}, "Invalid token", false));
  }
};
