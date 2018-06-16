/*
  Pads the given text with empty lines on the top or bottom.
*/

module.exports = function (string, top = 1, bottom, char = '\n') {
  if (top && !bottom) {
    // If only one number is given, apply to both top and bottom.
    bottom = top
  }

  string = string.trim()
  while (top > 0) {
    string = char + string
  }
  while (bottom > 0) {
    string = string + char
  }

  return string
}