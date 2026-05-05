const express = require("express");
const upload = require("../middlewares/uploadMiddleware");
const {
  createPost,
  getPosts,
  getAdminPosts,
  getPostById,
  updatePost,
  deletePostImage,
  setCoverImage,
  deletePost,
} = require("../controllers/postController");

const router = express.Router();

router.get("/admin/list", getAdminPosts);
router.get("/", getPosts);
router.get("/:id", getPostById);

router.post("/", upload.array("images", 10), createPost);
router.put("/:id", upload.array("images", 10), updatePost);
router.delete("/:id", deletePost);

router.delete("/images/:imageId", deletePostImage);
router.patch("/images/:imageId/cover", setCoverImage);

module.exports = router;