/**
 * Sort factory functions. Intended to be passed in to Array.sort()
 */

exports.byProperty = function (prop) {
  return function (a, b) {
    return a[prop] < b[prop] ? -1 : 1
  }
}

exports.byProperties = function (...properties) {
  
}