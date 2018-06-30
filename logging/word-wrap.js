const breakable = [' ', '-']

module.exports = function (str, length, indent = 0) {
  let buffer = []
  let inWord = false
  let accum = 0
  let i = 0

  if (typeof indent !== 'string' && typeof indent !== 'number') {
    throw new Error('indent must be either a string or a number')
  }

  function br () {
    accum = 0
    // Remove trailing spaces from previous line
    while (buffer[buffer.length - 1] === ' ') {
      buffer.pop()
    }

    // Add line break and indent
    if (typeof indent === 'number') {
      buffer.push('\n')
      for (let i = 0; i < indent; i++) {
        buffer.push(' ')
      }
    } else if (typeof indent === 'string') {
      buffer.push(...indent)
    }

    // Remove leading spaces from new line
    while (str[i] === ' ') {
      i++
    }
  }

  function backtrack () {
    while (!breakable.includes(str[i]) && i > 0) {
      buffer.pop()
      i--
    }
  }

  while (i < str.length) {
    if (accum >= length) {
      if (inWord) {
        backtrack()
        br()
      } else {
        br()
      }
    }

    switch (str[i]) {
      case ' ':
      case '-':
        inWord = false
        buffer.push(str[i])
        break
      default:
        inWord = true
        buffer.push(str[i])
        break
    }

    accum++
    i++
  }

  return buffer.join('')
}