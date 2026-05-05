function requireAuth(req, res, next) {
  if (!req.session || !req.session.admin) {
    return res.redirect("/yonetim-giris");
  }

  next();
}

module.exports = {
  requireAuth,
};