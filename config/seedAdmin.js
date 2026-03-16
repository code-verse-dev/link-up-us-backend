/**
 * Ensure a default admin user exists. Run once after DB connect on server start.
 * Credentials: ADMIN_EMAIL (default admin@linkup.us), ADMIN_PASSWORD (default admin123).
 */
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");

async function seedAdminIfNeeded() {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@linkup.us").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const existing = await Admin.findOne({ email: adminEmail });
    if (existing) {
      // In development, sync password so .env ADMIN_PASSWORD always works
      if (process.env.NODE_ENV !== "production") {
        existing.password = await bcrypt.hash(adminPassword, 10);
        await existing.save();
        console.log("[seedAdmin] Updated default admin password to match .env");
      }
      return;
    }
    const admin = new Admin({
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      name: "Admin",
    });
    await admin.save();
    console.log("[seedAdmin] Created default admin:", adminEmail, "(password:", adminPassword + ")");
  } catch (err) {
    console.error("[seedAdmin] Error:", err.message);
  }
}

module.exports = { seedAdminIfNeeded };
