const getLabelFor = require("./get-label-for");
const path = require("path");
const fs = require("fs");

module.exports = (config, current) => {
  // Updates the ~/.punch/current file
  let label = "";
  if (typeof current === "string") {
    label = current;
  } else if (current.in) {
    label = getLabelFor(config, current.project);
  }

  fs.writeFileSync(path.join(path.dirname(config.configPath), "current"), label);
};