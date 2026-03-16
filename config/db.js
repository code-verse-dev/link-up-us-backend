const mongoose = require("mongoose");

const { DB } = process.env;

mongoose
  .connect(DB)
  .then(async () => {
    console.log("Connected to database successfully");
    const { seedAdminIfNeeded } = require("./seedAdmin");
    await seedAdminIfNeeded();
  })
  .catch((err) => {
    console.log("Database connection error:", err);
  });

module.exports = mongoose;
