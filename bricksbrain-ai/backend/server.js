require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const chatRoutes = require("./routes/chatRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// DB
connectDB();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use("/api", limiter);

// Serve uploaded property photos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.get("/", (req, res) => res.json({ message: "BricksBrain AI backend is running" }));
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`BricksBrain backend running on port ${PORT}`);
});