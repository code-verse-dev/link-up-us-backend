const Admin = require("../../models/Admin");
const { ApiResponse } = require("../../helpers");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function generateAdminToken(admin) {
  return jwt.sign(
    { _id: admin._id, email: admin.email, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/** POST /api/admin/auth/login */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json(ApiResponse({}, "Email and password required", false));
    }
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json(ApiResponse({}, "Invalid credentials", false));
    }
    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json(ApiResponse({}, "Invalid credentials", false));
    }
    const token = generateAdminToken(admin);
    const a = admin.toObject();
    delete a.password;
    delete a.resetToken;
    delete a.resetTokenExpires;
    return res.json(ApiResponse({ admin: a, token }, "Logged in", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** POST /api/admin/auth/forgot-password — create reset token (in production send email) */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !email.trim()) {
      return res.status(400).json(ApiResponse({}, "Email required", false));
    }
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.json(ApiResponse({ message: "If that email exists, a reset link was sent." }, "OK", true));
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    admin.resetToken = resetToken;
    admin.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await admin.save();
    const baseUrl = process.env.ADMIN_APP_URL || process.env.FRONTEND_URL || "http://localhost:5174";
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
    if (process.env.NODE_ENV !== "production") {
      return res.json(ApiResponse({ resetLink, message: "Use this link to reset (dev only)." }, "OK", true));
    }
    return res.json(ApiResponse({ message: "If that email exists, a reset link was sent." }, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** POST /api/admin/auth/reset-password — set new password using token from email link */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json(ApiResponse({}, "Valid token and new password (min 6 chars) required", false));
    }
    const admin = await Admin.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() },
    });
    if (!admin) {
      return res.status(400).json(ApiResponse({}, "Invalid or expired reset token", false));
    }
    admin.password = await bcrypt.hash(newPassword, 10);
    admin.resetToken = undefined;
    admin.resetTokenExpires = undefined;
    await admin.save();
    return res.json(ApiResponse({}, "Password reset. You can log in.", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** POST /api/admin/auth/change-password — change password when logged in (admin auth required) */
exports.changePassword = async (req, res) => {
  try {
    const adminId = req.admin?._id;
    if (!adminId) {
      return res.status(401).json(ApiResponse({}, "Unauthorized", false));
    }
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json(ApiResponse({}, "Current password and new password (min 6 chars) required", false));
    }
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(401).json(ApiResponse({}, "Unauthorized", false));
    }
    const match = await bcrypt.compare(currentPassword, admin.password);
    if (!match) {
      return res.status(400).json(ApiResponse({}, "Current password is incorrect", false));
    }
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();
    return res.json(ApiResponse({}, "Password updated", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** GET /api/admin/auth/me — current admin (admin auth required) */
exports.me = async (req, res) => {
  try {
    const admin = req.admin;
    if (!admin) {
      return res.status(401).json(ApiResponse({}, "Unauthorized", false));
    }
    const a = admin.toObject();
    delete a.password;
    delete a.resetToken;
    delete a.resetTokenExpires;
    return res.json(ApiResponse(a, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** PATCH /api/admin/auth/profile — update name & email (admin auth required) */
exports.updateProfile = async (req, res) => {
  try {
    const adminId = req.admin?._id;
    if (!adminId) {
      return res.status(401).json(ApiResponse({}, "Unauthorized", false));
    }
    const { name, email, avatarUrl } = req.body || {};
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(401).json(ApiResponse({}, "Unauthorized", false));
    }
    if (typeof name === "string" && name.trim()) admin.name = name.trim();
    if (typeof avatarUrl === "string") admin.avatarUrl = avatarUrl;
    if (typeof email === "string" && email.trim()) {
      const newEmail = email.trim().toLowerCase();
      if (newEmail !== admin.email) {
        const existing = await Admin.findOne({ email: newEmail });
        if (existing) {
          return res.status(400).json(ApiResponse({}, "That email is already in use", false));
        }
        admin.email = newEmail;
      }
    }
    await admin.save();
    const a = admin.toObject();
    delete a.password;
    delete a.resetToken;
    delete a.resetTokenExpires;
    return res.json(ApiResponse(a, "Profile updated", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** POST /api/admin/auth/avatar — upload avatar (multipart), admin auth required */
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file || !req.file.filename) {
      return res.status(400).json(ApiResponse({}, "No file uploaded", false));
    }
    const adminId = req.admin?._id;
    if (!adminId) {
      return res.status(401).json(ApiResponse({}, "Unauthorized", false));
    }
    const url = `/Uploads/${req.file.filename}`;
    const admin = await Admin.findByIdAndUpdate(adminId, { avatarUrl: url }, { new: true }).lean();
    if (!admin) {
      return res.status(401).json(ApiResponse({}, "Unauthorized", false));
    }
    const a = { ...admin };
    delete a.password;
    delete a.resetToken;
    delete a.resetTokenExpires;
    return res.json(ApiResponse(a, "Avatar updated", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
