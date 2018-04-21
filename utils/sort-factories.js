/**
 * Sort factory functions. Intended to be passed in to Array.sort()
 */

exports.descendingBy = function(property) {
  return function(a, b) {
    return a[property] > b[property] ? -1 : 1
  }
}

exports.ascendingBy = function(property) {
  return function(a, b) {
    return a[property] < b[property] ? -1 : 1
  }
}