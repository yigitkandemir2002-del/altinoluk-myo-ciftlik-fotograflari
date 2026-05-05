const express = require("express");
const {
  loginAdmin,
  logoutAdmin,
  checkAuth,
} = require("../controllers/authController");

const router = express.Router();

router.post("/login", loginAdmin);
router.post("/logout", logoutAdmin);
router.get("/check", checkAuth);

module.exports = router;