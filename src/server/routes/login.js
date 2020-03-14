const route = require("express").Router();
const passport = require("passport");

route.get("/", function(req, res) {
  console.log(req.flash());
  res.render("sections/auth/login", {});
});

route.post(
  "/",
  (req, res, next) => {
    console.log(req.body);
    next();
  },
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
  })
);

module.exports = route;
