const _ = require("lodash");

module.exports = ({ config }) =>
  function (value, field) {
    let project;

    if (
      typeof value === "object" &&
      typeof value.name === "string" &&
      value.client != null
    ) {
      project = value;
    } else {
      project = config.projects[value];
    }

    if (field != null) {
      return _.get(project, field);
    } else {
      return project;
    }
  };
