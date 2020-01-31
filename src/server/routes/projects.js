const route = require("express").Router();

route.get("/", function(req, res) {
  const { props } = req;
  const { projects } = props.config;

  res.render("projects/index", { projects, props });
});

route.get("/:alias", function(req, res) {
  const { props } = req;
  const { projects } = props.config;

  const project = projects[req.params.alias];

  if (project) {
    res.render("projects/show", { project, props });
  } else {
    // TODO: Show 404
  }
});

module.exports = route;
