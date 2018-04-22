module.exports = function table (opts) {
  const chalk = require('chalk')

  const { header, rows } = opts
  const padding = ''.padEnd(opts.padding || 3)
  const columnCount = rows[0].length
  const colWidths = []

  for (let i = 0; i < columnCount; i++) {
    let max = 0

    for (let r = 0; r < rows.length; r++) {
      const { length } = rows[r][i].toString()
      if (length > max) {
        max = length
      }
    }

    if (header) {
      const { length } = header[i].toString()
      if (length > max) {
        max = length
      }
    }

    colWidths[i] = max
  }

  let head
  if (header) {
    head = header.map((h, i) => {
      return chalk.bold(h.toString().padEnd(colWidths[i], '.'))
    }).join(padding)
  }

  const body = rows.map(row => {
    return row.map((column, i) => {
      return column.toString().padStart(colWidths[i])
    }).join(padding)
  }).join('\n')

  return head ? (head + '\n') : '' + body
}
