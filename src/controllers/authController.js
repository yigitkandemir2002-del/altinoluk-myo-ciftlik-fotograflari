const pool = require("../db");
const bcrypt = require("bcrypt");

const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Kullanıcı adı ve şifre zorunludur.",
      });
    }

    const result = await pool.query(
      "SELECT id, username, password_hash FROM cf_admins WHERE username = $1 LIMIT 1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Kullanıcı adı veya şifre hatalı.",
      });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Kullanıcı adı veya şifre hatalı.",
      });
    }

    req.session.admin = {
      id: admin.id,
      username: admin.username,
    };

    return res.status(200).json({
      success: true,
      message: "Giriş başarılı.",
    });
  } catch (error) {
    console.error("loginAdmin hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
    });
  }
};

const logoutAdmin = (req, res) => {
  req.session.destroy(() => {
    return res.status(200).json({
      success: true,
      message: "Çıkış yapıldı.",
    });
  });
};

const checkAuth = (req, res) => {
  if (req.session && req.session.admin) {
    return res.status(200).json({
      success: true,
      authenticated: true,
      admin: req.session.admin,
    });
  }

  return res.status(200).json({
    success: true,
    authenticated: false,
  });
};

module.exports = {
  loginAdmin,
  logoutAdmin,
  checkAuth,
};