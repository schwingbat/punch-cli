module.exports = function ({ style, letterSpacing }) {
  const path = require('path')
  // const chalk = require('chalk')
  let clock

  style = style || 'block-clock'
  letterSpacing = letterSpacing || 1

  try {
    clock = require(path.join(global.appRoot, 'resources', 'clock-styles', style + '.json'))
  } catch (err) {
    throw new Error('Failed to load clock style: ' + style)
  }

  const spaceChar = clock.spaceCharacter || ' '

  for (const char in clock.characters) {
    clock.characters[char].lines = clock.characters[char].lines.map(line => {
      return line.replace(/\s/g, spaceChar)
    })
  }

  // Validate

  function validate (characters) {
    const errors = []

    for (const char in characters) {
      const { width, height, lines } = characters[char]

      if (lines.length !== height) {
        errors.push(`Character ${char} has a height of ${height}, but has ${lines.length} lines.`)
        continue
      }

      lines.forEach((line, i) => {
        if (line.length !== width) {
          errors.push(`Line at index ${i} of character ${char} should be ${width} characters wide. Is ${line.length} wide.`)
        }
      })
    }

    return errors
  }

  const errors = validate(clock.characters)
  if (errors.length > 0) {
    console.error(errors)
  }

  return {
    display (string) {
      const chars = string.split('').map(c => clock.characters[c])

      let output = ''
      let height = Math.max(...chars.map(c => c.height))
      let remaining = height

      while (remaining > 0) {
        output += spaceChar
        chars.forEach((char, i) => {
          output += char.lines[height - remaining]
          if (i + 1 !== chars.length) {
            output += spaceChar
          }
        })
        output += spaceChar
        output += '\n'
        remaining--
      }

      return output
    }
  }
}