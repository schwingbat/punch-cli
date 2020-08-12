const route = require("express").Router();
const formatDistanceToNow = require("date-fns/formatDistanceToNow");

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

  const now = new Date();

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

    const latestPunches = await Promise.all(clientProjects.map(p => Punch.latest(p.alias)));

    latestPunches.sort((a, b) => {
      const left = a.out || now;
      const right = b.out || now;

      if (left > right) {
        return -1;
      } else if (left < right) {
        return 1;
      } else {
        return 0;
      }
    });

    let lastActiveLabel = "Never";

    if (current.any) {
      lastActiveLabel = "Now";
    } else if (latestPunches.length > 0) {
      const mostRecent = latestPunches[0];
      const project = config.projects[mostRecent.project];

      lastActiveLabel = formatDistanceToNow(mostRecent.out, {
        addSuffix: true
      }) + ` (${project.name})`;
    }

    let totalDuration = 0;
    let totalPay = 0;

    const projectAliases = clientProjects.map(p => p.alias);
    const clientPunches = await Punch.filter(p => projectAliases.includes(p.project));
    clientPunches.forEach(punch => {
      totalDuration += punch.duration();
      totalPay += punch.pay();
    });

    res.render("sections/clients/show", {
      client: {
        name: req.params.name,
        ...client
      },
      current,
      lastActiveLabel,
      totalDuration,
      totalPay,
      projects: clientProjects,
      props
    });
  } else {
    // TODO: Show 404
  }
});

module.exports = route;
