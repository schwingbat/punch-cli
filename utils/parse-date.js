module.exports = function (str, today = new Date()) {
  // Parses dates in format MM/DD/YYYY or YYYY/MM/DD format
  // Accepts any combination of slash, dash or period as delimiters
  const parts = str.match(/(\d+)[-/.](\d+)[-/.](\d+)/)
  if (parts) {
    let year, month, day

    if (parts[1].length === 4) {
      // Assume YYYY/MM/DD format
      year = Number(parts[1])
      month = Number(parts[2])
      day = Number(parts[3])
    } else if (parts[3].length === 4) {
      // Assume MM/DD/YYYY format
      year = Number(parts[3])
      month = Number(parts[1])
      day = Number(parts[2])
    } else if (parts[3].length === 2) {
      // Year should be relative to current century.
      // If year is after the current year, fall back to last century.
      let centuryBase = Math.trunc(today.getFullYear() / 100) * 100
      year = centuryBase + Number(parts[3])
      month = Number(parts[1])
      day = Number(parts[2])
      if (year > today.getFullYear()) {
        year -= 100
      }
    } else {
      return null
    }

    return new Date(year, month - 1, day)
  } else {
    return null
  }
}
