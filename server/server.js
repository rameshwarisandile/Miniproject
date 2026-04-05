const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));





// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(process.env.PORT || 8120, () => {
      console.log("Server running on port " + (process.env.PORT || 8120));
      console.log("Connected to MongoDB at " + process.env.MONGO_URI);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
