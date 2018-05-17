// Loads a random line from a file of newline-separated strings.

module.exports = function (what, opts = {}) {
  const fs = require('fs')
  const path = require('path')
  const fileName = what.replace(' ', '-')

  try {
    const contents = fs.readFileSync(path.join(__dirname, 'messages', fileName), 'utf8')
    const lines = contents.split('\n')

    return lines[Math.round(Math.random() * (lines.length - 1))]
  } catch (err) {
    return opts.default || 'No messages for ' + what + ' (' + err.message + ')'
  }
}
