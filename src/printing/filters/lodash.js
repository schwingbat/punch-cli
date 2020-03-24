/**
 * Exports lodash functions as filters.
 */

const _ = require("lodash");

module.exports = env => {
  env.addFilter("map", _.map);
};
