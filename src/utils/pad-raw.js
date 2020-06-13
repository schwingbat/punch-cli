const regex = require("ansi-regex")();

/**
 * Pad the beginning of a string, ignoring any ANSI escape sequences.
 */
exports.padStartRaw = function (str, len, char = " ") {
  let diff = len - str.replace(regex, "").length;
  while (diff > 0) {
    str = char + str;
    diff--;
  }
  return str;
};

/**
 * Pad the end of a string, ignoring and ANSI escape sequences.
 */
exports.padEndRaw = function (str, len, char = " ") {
  let diff = len - str.replace(regex, "").length;
  while (diff > 0) {
    str += char;
    diff--;
  }
  return str;
};
