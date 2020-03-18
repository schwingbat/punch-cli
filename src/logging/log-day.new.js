module.exports = function({
  config,
  punches,
  date,
  summary,
  project,
  interval
}) {
  const { template } = require("../printing")(config);

  console.log("TEST", summary);

  console.log(
    template("day-punches", {
      date,
      punches
    })
  );
};
