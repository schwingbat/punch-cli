const chalk = require('chalk')

function parseSignature (str) {
  let i = 0
  let end = str.length
  const argMap = []

  let buffer = ''
  let inArg = false
  let isRequired = false
  let isVariadic = false

  const addArg = () => {
    const obj = {
      name: buffer,
      required: isRequired,
      variadic: isVariadic
    }

    argMap.push(obj)
    buffer = ''

    inArg = false
    isRequired = false
    isVariadic = false
  }

  while (i < end) {
    switch (str[i]) {
      case '<':
        inArg = true
        isRequired = true
        break
      case '>':
        addArg()
        break
      case '[':
        inArg = true
        isRequired = false
        break
      case ']':
        addArg()
        break
      case '.':
        if (inArg && buffer.length > 0) {
          let eq = str[i] === '.' &&
                   str[i + 1] === '.' &&
                   str[i + 2] === '.'

          if (eq) {
            i += 2
            isVariadic = true
          }
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

function applyArgExtras (argMap, extras) {
  // Apply any extra properties provided in the arguments array when the command
  // was instantated. Descriptions, parsing functions and other properties are
  // added to their respective arguments.

  if (extras) {
    extras.forEach(props => {
      const mapped = argMap.find(arg => arg.name === props.name)
      if (mapped) {
        mapped.description = props.description
        mapped.parse = props.parse
        if (props.default) {
          mapped.default = props.default
        }
      }
    })
  }

  return argMap
}

function mapArgs (args, argMap, optionMap = []) {
  // Using a command's argMap, map the args to their proper names.

  const mapped = {
    raw: args,
    options: {}
  }

  // Set default values
  optionMap.filter(o => o.default).forEach(o => {
    if (typeof o.default === 'function') {
      mapped.options[o.name] = o.default()
    } else {
      mapped.options[o.name] = o.default
    }
  })

  // Override default values with given ones.
  const withoutFlags = []
  for (let i = 0; i < args.length; i++) {
    if (args[i].toLowerCase() === '--help') {
      mapped.options.help = true
    } else if (args[i][0] === '-') {
      let [arg, value] = args[i].replace(/^-*/g, '').split('=')
      const map = optionMap.find(op => op.name === arg || op.short === arg)
      if (map) {
        if (typeof map.type === 'string') {
          if (map.type.toLowerCase() === 'boolean') {
            mapped.options[map.name] = true
          } else {
            if (!value) {
              value = args[i + 1]
              i++
            }

            switch (map.type.toLowerCase()) {
              case 'string':
                break
              case 'number':
                value = Number(value)
                break
              default:
                console.log(`Type ${map.type} is not yet supported for options. Pass a function as the type to use it as a custom parser.`)
                break
            }
            mapped.options[map.name] = value
          }
        } else if (typeof map.type === 'function') {
          if (map.type === Boolean) {
            mapped.options[map.name] = true
          } else {
            if (!value) {
              value = args[i + 1]
              i++
            }
            mapped.options[map.name] = map.type(value)
          }
        } else {
          console.log(`option.${map.name}: Type must be either a string or a function. Is ${typeof map.type}`)
        }
      }
    } else {
      withoutFlags.push(args[i])
    }
  }

  args = withoutFlags

  argMap.forEach((arg, i) => {
    if (args[i]) {
      let value
      if (arg.variadic) {
        value = args.slice(i)
      } else {
        value = args[i]
      }
      if (typeof arg.parse === 'function') {
        try {
          value = arg.parse(value)
        } catch (err) {
          arg._error = err
        }
      }
      mapped[arg.name] = value
    } else if (arg.hasOwnProperty('default')) {
      if (typeof arg.default === 'function') {
        mapped[arg.name] = arg.default()
      } else {
        mapped[arg.name] = arg.default
      }
    }
  })

  return mapped
}

function requiredArgsProvided (mappedArgs, argMap) {
  // Make sure the non-optional args are all supplied.

  for (let i = 0; i < argMap.length; i++) {
    const marg = argMap[i]
    if (marg.required && mappedArgs[marg.name] == null) {
      return false
    }
  }

  return true
}

const paramExplanation = `
  a ${chalk.bold('<param>')} is required
  a ${chalk.bold('[param]')} is optional
  a ${chalk.bold('param...')} groups any arguments after this point into one argument
`

function indent (depth = 1) {
  let str = ''
  while (str.length < depth * 2) {
    str += '  '
  }
  return str
}

function argTable (args) {
  let signatures = args.map(a => a[0])
  let minSigLength = signatures.reduce((max, sig) => sig.length > max ? sig.length : max, 0)
  let str = ''

  args.forEach(([sig, desc]) => {
    str += sig.padEnd(minSigLength + 5)
    str += desc
    str += '\n'
  })

  return str
}

function makeHelp (programName, commandName, command, mapped, highlightMissing = true) {
  let str = '\n'

  if (command.description) {
    str += `${command.description}\n\n`
  }

  str += `Usage: ${programName} ${commandName}`

  if (command.options.length > 0) {
    str += ' [OPTIONS]'
  }

  if (command.args.length > 0) {
    command.args.forEach(arg => {
      let argStr = ' '
      let argName = arg.name
      if (arg.variadic) {
        argName += '...'
      }

      if (arg.required) {
        argStr += `<${argName}>`
      } else {
        argStr += `[${argName}]`
      }

      if (arg._error) {
        str += chalk.bold.red(argStr)
      } else {
        // Highlight in red if this arg was missed.
        if (!mapped[arg.name] && highlightMissing) {
          if (arg.required) {
            str += chalk.bold.red(argStr)
          } else {
            str += chalk.bold.yellow(argStr)
          }
        } else {
          str += argStr
        }
      }
    })
  }

  str += '\n'

  if (command.examples && command.examples.length > 0) {
    str += '\n'
    str += '  e.g. '

    command.examples.forEach((ex, i) => {
      str += ex + '\n'
      if (command.examples[i + 1]) {
        str += '       '
      }
    })
  }

  if (command.args.length > 0) {
    str += `\nARGUMENTS\n`
    str += argTable(command.args.map(a => [a.name, a.description]))
  }

  if (command.options.length > 0) {
    str += '\nOPTIONS\n'
    const signatures = []
    const descriptions = []

    command.options.forEach(o => {
      let sig = ''
      let desc = o.description || 'no description'

      if (o.short) {
        sig += `-${o.short}`
        if (o.name) sig += ', '
      }
      if (o.name) {
        sig += `--${o.name}`
      }
      if (o.type !== 'boolean' && o.type !== Boolean) {
        sig += ' <value>'
      }
      signatures.push(sig)
      descriptions.push(desc)
    })

    let args = []
    for (let i = 0; i < signatures.length; i++) {
      args.push([signatures[i], descriptions[i]])
    }

    str += argTable(args)
  }

  return str + '\n'
}

function makeGeneralHelp (program, commands) {
  let str = '\n'

  str += indent() + program.name + ' v' + program.version + '\n'
  str += paramExplanation + '\n'
  str += `  Run ${chalk.green('punch <command> --help')} with any of the following commands for more information.\n\n`
  str += chalk.bold('  Commands:') + '\n'

  for (const cmd in commands) {
    const { signature, description, hidden } = commands[cmd]

    if (!hidden) {
      str += indent(2) + signature + '\n'
      if (description) {
        str += indent(3) + chalk.italic.grey(description) + '\n'
      }
    }
  }

  return str + '\n'
}

function CLI (program) {
  const commands = {}

  const command = (signature, config) => {
    if (!config || config.disabled) {
      // BAIL!
      return
    }

    const { description, run } = config

    const command = signature.split(' ')[0]

    commands[command] = {
      signature,
      description,
      examples: config.examples || [],
      args: applyArgExtras(
        parseSignature(signature),
        config.arguments
      ),
      options: config.options || [],
      hidden: !!config.hidden,
      run
    }
  }

  const run = (args) => {
    const command = args.shift()
    const cmd = commands[command]

    if (!cmd || command.toLowerCase() === 'help') {
      return console.log(makeGeneralHelp(program, commands))
    }

    const mapped = mapArgs(args, cmd.args, cmd.options)

    if (mapped.options.help) {
      // Show help
      console.log(makeHelp(program.name, command, cmd, mapped, false))
    } else {
      for (let i = 0; i < cmd.args.length; i++) {
        if (cmd.args[i]._error) {
          return console.log(`There was a problem parsing '${cmd.args[i].name}':\n  ${chalk.red(cmd.args[i]._error.message)}`)
        }
      }

      if (!requiredArgsProvided(mapped, cmd.args)) {
        return console.log(makeHelp(program.name, command, cmd, mapped))
      }

      return cmd.run.call(null, mapped)
    }
  }

  const invoke = (command, args) => {
    // Invoke another command with the given args array.
    run([].concat(command.split(' '), args || []))
  }

  return {
    command,
    run,
    invoke,

    // Expose for testing.
    __testRefs: {
      commands,
      parseSignature,
      mapArgs,
      applyArgExtras,
      requiredArgsProvided,
      makeHelp,
      makeGeneralHelp
    }
  }
}

module.exports = CLI
