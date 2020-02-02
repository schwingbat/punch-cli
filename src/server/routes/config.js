const route = require("express").Router();

route.get("/", async function(req, res) {
  const { config } = req.props;

  res.render("sections/config/index", { config });
});

module.exports = route;
