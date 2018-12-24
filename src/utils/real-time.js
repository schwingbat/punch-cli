/*
 * Calculates the amount of total time represented in an array of time spans.
 * Because you can punch into multiple projects at the same time, the summary
 * gives the total billable hours which may add up to more time than was
 * physically worked. This function calculates how much time was actually
 * spent working by deduplicating overlapping times.
 *
 * Returns a number of total milliseconds represented by the spans.
 */

module.exports = function (spans, { start, end } = {}) {
  /*
   * spans = [{ start: Date, end: Date }, ...]
   *
   * Also takes an optional
   */

  // Clone so we can mutate
  spans = spans.map(s => ({
    ...s,
    start: new Date(s.start),
    end: new Date(s.end)
  }))

  // 1. Compare all spans against each other. If a span fits within another span it can be discarded.
  spans = spans.filter(s => {
    for (let i = 0; i < spans.length; i++) {
      if (spans[i] !== s && spans[i].start <= s.start && spans[i].end >= s.end) {
        return false
      }
    }
    return true
  })

  // 2. Cut time from beginning of spans if they overlap with another.
  for (const span of spans) {

    // Limit to bounds if any were passed.
    if (start && span.start < start) {
      span.start = start
    }

    if (end && span.end > end) {
      span.end = end
    }

    for (const compared of spans) {
      if (span !== compared) {
        if (span.start >= compared.start && span.start <= compared.end) {
          span.start = compared.end
        }
      }
    }
  }

  // 3. Add up milliseconds of remaining span values.
  const ms = spans.reduce((sum, s) => sum + (s.end.getTime() - s.start.getTime()), 0)

  return ms
}