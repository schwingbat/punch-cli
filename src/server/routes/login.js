const route = require("express").Router();
const passport = require("passport");

route.get("/", function (req, res) {
  console.log(req.flash());
  res.render("sections/auth/login", {
    layout: "base",
  });
});

route.post(
  "/",
  (req, res, next) => {
    next();
  },
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

module.exports = route;
