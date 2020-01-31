const route = require("express").Router();

route.get("/", function(req, res) {
  const { props } = req;
  const { name } = props.config.user;

  res.render("home/index", { name });
});

module.exports = route;
