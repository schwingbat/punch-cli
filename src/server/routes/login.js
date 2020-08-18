const route = require("express").Router();
const passport = require("passport");
const parseFlash = require("../utils/parse-flash");

const placeholders = ["hunter2", "p@ssw0rd", "v3ry5ecure"];

route.get("/", function (req, res) {
  const placeholder =
    placeholders[Math.round(Math.random() * (placeholders.length - 1))];

  res.render("sections/auth/login", {
    placeholder,
    messages: req.flash(),
  });
});

route.post(
  "/",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

module.exports = route;
