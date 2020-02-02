const route = require("express").Router();

route.get("/", async function(req, res) {
  res.render("sections/invoices/index", {});
});

module.exports = route;
