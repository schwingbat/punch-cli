// Merge two nested objects recursively.

const is = require("@schwingbat/is");

module.exports = function merge(one, two) {
  const out = {};

  for (const key in one) {
    out[key] = one[key];
  }

  for (const key in two) {
    if (is.object(two[key])) {
      out[key] = merge(out[key], two[key]);
    } else {
      out[key] = two[key];
    }
  }

  return out;
};
