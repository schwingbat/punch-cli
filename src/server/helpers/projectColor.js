const _ = require("lodash");

const colorNames = [
  "blue",
  "cyan",
  "gray",
  "green",
  "magenta",
  "red",
  "yellow",
];

module.exports = ({ config }) =>
  function (value) {
    let project;

    if (typeof value === "string") {
      project = config.projects[value];
    } else {
      project = value;
    }

    const color = _.get(project, "color");

    if (color) {
      if (colorNames.includes(color.toLowerCase())) {
        return `var(--color-${color.toLowerCase()})`;
      } else {
        return color;
      }
    } else {
      return "var(--color-gray)";
    }
  };
