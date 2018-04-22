const chalk = require('chalk')

function parseSignature (str) {
  let i = 0
  let end = str.length
  const argMap = []

  let buffer = ''
  let inArg = false
  let inOpt = false
  let inSplat = false
  let inMulti = false

  const addArg = () => {
    if (inSplat && inMulti) {
      throw new Error(`Error at index ${i} - param is both splat and multiple`)
    }

    const obj = {
      name: buffer,
      optional: inOpt,
      multiple: inMulti,
      splat: inSplat
    }

    argMap.push(obj)
    buffer = ''

    inArg = false
    inOpt = false
    inSplat = false
    inMulti = false
  }

  while (i < end) {
    switch (str[i]) {
      case '<':
        inArg = true
        inOpt = false
        break
      case '>':
        addArg()
        break
      case '[':
        inArg = true
        inOpt = true
        break
      case ']':
        addArg()
        break
      case '.':
        if (inArg && buffer.length > 0) {
          let eq = str[i] === '.'
                && str[i+1] === '.'
                && str[i+2] === '.'

          if (eq) {
            i += 2
            inMulti = true
          }
        }
        break
      case '*':
        if (inArg && buffer.length === 0) {
          // If '*' is the first thing to appear in the name
          inSplat = true
        }
        break
      case ' ':
        break
      default:
        if (inArg) {
          buffer += str[i]
        }
        break
    }

    i += 1
  }

  if (buffer.length > 0) {
    if (inArg) {
      addArg()
    }
  }

  return argMap
}

function mapArgs (args, argMap) {
  // Using a command's argMap, map the args to their proper names.

  const mapped = {}

  // TODO: Parse option flags and add values here
  Object.defineProperty(mapped, 'options', {
    value: {},
    enumerable: false
  })

  argMap.forEach((arg, i) => {
    if (args[i]) {
      if (arg.splat) {
        mapped[arg.name] = args.slice(i).join(' ')
      } else if (arg.multiple) {
        mapped[arg.name] = args.slice(i)
      } else {
        mapped[arg.name] = args[i]
      }
    }
  })

  return mapped
}

function requiredArgsProvided (mappedArgs, argMap) {
  // Make sure the non-optional args are all supplied.

  for (let i = 0; i < argMap.length; i++) {
    const marg = argMap[i]
    if (!marg.optional && !mappedArgs[marg.name]) {
      return false
    }
  }

  return true
}

function formatSentence (str) {
  let sentence = str[0].toUpperCase() + str.slice(1)
  if (sentence[sentence.length - 1] !== '.') {
    sentence += '.'
  }

  return sentence
}

function toSnakeCase (str) {
  return str.replace(/([a-z][A-Z])/g, cap => cap[0] + '_' + cap[1].toLowerCase())
}

function makeHelp (programName, command, argMap, mapped) {
  let str = '\n'

  str += `Usage: ${programName} ${command}`

  argMap.forEach(arg => {
    let argStr = ' '
    let name = toSnakeCase(arg.name)
    if (arg.splat) {
      name += '...'
    }

    if (arg.optional) {
      argStr += `[${name}]`
    } else {
      argStr += `<${name}>`
    }

    // Highlight in red if this arg was missed.
    if (!mapped[arg.name]) {
      if (arg.optional) {
        str += chalk.bold.yellow(argStr)
      } else {
        str += chalk.bold.red(argStr)
      }
    } else {
      str += argStr
    }
  })

  return str + '\n'
}

function indent (depth = 1) {
  let str = ''
  while (str.length < depth * 2) {
    str += '  '
  }
  return str
}

function makeGeneralHelp (program, commands) {
  let str = '\n'

  str += indent() + program.name + ' v' + program.version + '\n\n'
  str += chalk.bold('  Commands:') + '\n'

  for (const cmd in commands) {
    const { signature, description, hidden } = commands[cmd]

    if (!hidden) {
      str += indent(2) + toSnakeCase(signature) + '\n'
      if (description) {
        str += indent(3) + chalk.italic.grey(formatSentence(description)) + '\n'
      }
    }
  }

  return str + '\n'
}

function CLI (program) {
  const commands = {}

  const command = (...args) => {
    let config

    if (typeof args[0] === 'string' && typeof args[1] === 'string' && typeof args[2] === 'function') {
      // command(signature, description, run)

      config = {
        signature: args[0],
        description: args[1],
        run: args[2]
      }
    } else if (typeof args[0] === 'string' && typeof args[1] === 'object') {
      // command(signature, config)

      config = {
        signature: args[0],
        ...args[1]
      }
    } else if (typeof args[0] === 'object') {
      // command(config)

      config = args[0]
    }

    if (config.disabled) {
      // BAIL!
      return
    }

    const { signature, description, run } = config

    const command = signature.split(' ')[0]

    commands[command] = {
      signature,
      description,
      args: parseSignature(signature),
      hidden: !!config.hidden,
      run
    }
  }

  const run = (args) => {
    const command = args[0]
    const cmd = commands[command]

    if (!cmd || command.toLowerCase() === 'help') {
      return console.log(makeGeneralHelp(program, commands))
    }

    const mapped = mapArgs(args.slice(1), cmd.args)

    if (!requiredArgsProvided(mapped, cmd.args)) {
      return console.log(makeHelp(program.name, command, cmd.args, mapped))
    }

    return cmd.run.call(null, mapped)
  }

  const invoke = (command, args) => {
    // Invoke another command with the given args array.
    run([].concat(command.split(' '), args || []))
  }

  return { command, run, invoke }
}

// Expose for testing.
CLI.___ = {
  parseSignature,
  mapArgs,
  requiredArgsProvided
}

module.exports = CLI
