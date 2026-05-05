const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
require("dotenv").config();

const postRoutes = require("./routes/postRoutes");
const authRoutes = require("./routes/authRoutes");
const { requireAuth } = require("./middlewares/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "ciftlik-foto-gizli-anahtar",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api/posts", postRoutes);
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.get("/post/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "post.html"));
});

app.get("/yonetim-giris", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});

app.get("/yonetim-paneli", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "admin-panel.html"));
});

app.get("/yonetim-postlar", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "admin-posts.html"));
});

app.get("/yonetim-post-duzenle/:id", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "admin-edit-post.html"));
});

app.use((err, req, res, next) => {
  console.error("Genel hata:", err.message);

  return res.status(400).json({
    success: false,
    message: err.message || "Bir hata oluştu.",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});