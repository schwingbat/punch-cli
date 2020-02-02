const route = require("express").Router();

route.get("/", function(req, res) {
  const { props } = req;
  const { clients } = props.config;

  const clientsList = [];

  for (const name in clients) {
    clientsList.push({
      name,
      ...clients[name]
    });
  }

  res.render("sections/clients/index", {
    clients: clientsList,
    props
  });
});

route.get("/:name", async function(req, res) {
  const { props } = req;
  const { clients } = props.config;
  const { name } = req.params;

  const { config, Punch } = props;

  const keys = Object.keys(clients).map(s => s.toLowerCase());

  if (keys.includes(name.toLowerCase())) {
    const client = {
      name,
      ...clients[name]
    };

    const clientProjects = [];

    for (const alias in config.projects) {
      const project = config.projects[alias];

      if (project.client && project.client.name === name) {
        clientProjects.push(project);
      }
    }

    const currentPunches = await Punch.select(
      punch =>
        !punch.deleted &&
        clientProjects.find(p => p.alias === punch.project) &&
        punch.out == null
    );

    const current = {
      any: currentPunches.length > 0,
      punches: currentPunches.map(punch => {
        return {
          ...punch,
          project: config.projects[punch.project]
        };
      })
    };

    res.render("sections/clients/show", {
      client: {
        name: req.params.name,
        ...client
      },
      current,
      projects: clientProjects,
      props
    });
  } else {
    // TODO: Show 404
  }
});

module.exports = route;
