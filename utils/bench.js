module.exports = function bench (options = {}) {
  let start = Date.now()
  let marks = []

  function printMark (mark, i) {
    const difference = mark.time - start
    const sinceLast = mark.time - (marks[i - 1] ? marks[i - 1].time : start)
    console.log('@' + difference + 'ms: ' + mark.comment + ' +' + sinceLast + 'ms')
  }

  return {
    mark: function (comment, opts = {}) {
      if (!options.disabled) {
        let mark = {
          time: Date.now(),
          comment
        }
        if (opts.print) {
          printMark(mark, marks.length - 1)
        }
        marks.push(mark)
      }
    },
    printAll: function () {
      if (options.disabled !== true) {
        marks.forEach(printMark)
      }
    }
  }
}
