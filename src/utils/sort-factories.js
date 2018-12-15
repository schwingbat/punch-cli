/**
 * Sort factory functions. Intended to be passed in to Array.sort()
 */

exports.descendingBy = function (property) {
  if (typeof property === 'function') {
    return function (a, b) {
      return property(a) > property(b) ? -1 : 1
    }
  } else if (typeof property === 'string') {
    return function (a, b) {
      return a[property] > b[property] ? -1 : 1
    }
  } else {
    throw new Error('Property must be either a string or a function. Received ' + typeof property)
  }
}

exports.ascendingBy = function (property) {
  if (typeof property === 'function') {
    return function (a, b) {
      return property(a) < property(b) ? -1 : 1
    }
  } else if (typeof property === 'string') {
    return function (a, b) {
      return a[property] < b[property] ? -1 : 1
    }
  } else {
    throw new Error('Property must be either a string or a function. Received ' + typeof property)
  }
}
