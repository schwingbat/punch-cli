const route = require("express").Router();
const { descendingBy } = require("../../utils/sort-factories");
const formatDistanceToNow = require("date-fns/formatDistanceToNow");

route.get("/", async function (req, res) {
  const { props } = req;
  const { projects } = props.config;

  res.render("sections/projects/index", { projects, props });
});

route.get("/:alias", async function (req, res) {
  const { props, params } = req;
  const { projects } = props.config;
  const { Punch } = props;

  const project = projects[req.params.alias];

  if (project) {
    const currentPunch = (await Punch.current(project.alias))[0];

    const recentPunches = (
      await Punch.filter((p) => p.out != null && p.project === project.alias)
    )
      .sort(descendingBy("in"))
      .slice(0, 3);

    let lastActiveLabel = "Never";

    if (currentPunch) {
      lastActiveLabel = "Now";
    } else if (recentPunches.length > 0) {
      const mostRecent = recentPunches[0];

      lastActiveLabel = formatDistanceToNow(mostRecent.out, {
        addSuffix: true,
      });
    }

    let totalDuration = 0;
    let totalPay = 0;

    const projectPunches = await Punch.filter(
      (p) => p.project === project.alias
    );
    projectPunches.forEach((punch) => {
      totalDuration += punch.duration();
      totalPay += punch.pay();
    });

    res.render("sections/projects/show", {
      project,
      currentPunch,
      recentPunches,
      totalDuration,
      totalPay,
      lastActiveLabel,
    });
  } else {
    // TODO: Show 404
  }
});

module.exports = route;
