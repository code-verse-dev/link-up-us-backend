const mongoose = require("mongoose");

const { DB } = process.env;

mongoose
  .connect(DB)
  .then(() => {
    console.log(`Connected to database successfully`);    
  })
  .catch((err) => {
    console.log("Database connection error:", err);
  });

module.exports = mongoose;
