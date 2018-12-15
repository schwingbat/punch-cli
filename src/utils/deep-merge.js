// Merge two nested objects recursively.

module.exports = function merge (one, two) {
  const out = {}

  for (const key in one) {
    out[key] = one[key]
  }

  for (const key in two) {
    if (typeof two[key] === 'object' && !Array.isArray(two[key])) {
      out[key] = merge(out[key], two[key])
    } else {
      out[key] = two[key]
    }
  }

  return out
}