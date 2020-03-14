const route = require("express").Router();

route.get("/", async function(req, res) {
  res.render("sections/menu/index", {});
});

module.exports = route;
