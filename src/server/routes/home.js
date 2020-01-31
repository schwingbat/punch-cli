const route = require("express").Router();

route.get("/", async function(req, res) {
  const { props } = req;
  const { name } = props.config.user;

  const { config, Punch } = props;

  const currentPunches = await Punch.select(
    punch => !punch.deleted && punch.out == null
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

  console.log(current);

  res.render("home/index", { name, current });
});

module.exports = route;
