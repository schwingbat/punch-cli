const route = require("express").Router();

route.get("/", function(req, res) {
  const { props } = req;
  const { projects } = props.config;

  res.render("sections/projects/index", { projects, props });
});

route.get("/:alias", async function(req, res) {
  const { props } = req;
  const { projects } = props.config;
  const { config, Punch } = props;

  const project = projects[req.params.alias];

  if (project) {
    const currentPunch = await Punch.current(project.alias);

    res.render("sections/projects/show", { project, currentPunch, props });
  } else {
    // TODO: Show 404
  }
});

module.exports = route;
