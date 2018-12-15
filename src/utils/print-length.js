/*
 * Gets the length of a string without any ANSI escape codes.
 * Chalk works great for colors, but the extra characters
 * in strings fucks with alignment when padding strings.
 * 
 * This function strips escape codes and returns the
 * resulting length.
 */

const regex = require('ansi-regex')()

module.exports = function (str) {
  return str.replace(regex, '').length
}