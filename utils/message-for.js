// Loads a random line from a file of newline-separated strings.

module.exports = function (what, opts = {}) {
  const fs = require('fs')
  const path = require('path')
  const fileName = what.toLowerCase().replace(' ', '-')
  const messagesPath = opts.messagesPath || path.join(global.appRoot, 'resources', 'messages')

  try {
    const contents = fs.readFileSync(path.join(messagesPath, fileName), 'utf8')
    const lines = contents.split('\n')

    return lines[Math.round(Math.random() * (lines.length - 1))]
  } catch (err) {
    return opts.default || 'No messages for ' + what + ' (' + err.message + ')'
  }
}
