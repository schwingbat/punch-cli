const chalk = require('chalk');

function parseOldCmdString(str) {
  let i = 0;
  let end = str.length;
  const argMap = [];

  let buffer = '';
  let inArg = false;
  let inSplat = false;

  const addArg = () => {
    const obj = {};
    if (buffer[buffer.length - 1] === '?') {
      obj.name = buffer.slice(0, buffer.length - 1);
      obj.optional = true;
    } else {
      obj.name = buffer;
      obj.optional = false;
    }

    if (inSplat) {
      obj.splat = true;
    }

    argMap.push(obj);
    buffer = '';

    inArg = false;
    inSplat = false;
  };

  while (i < end) {
    switch (str[i]) {
    case ':':
      inArg = true;
      break;
    case '*':
      inArg = true;
      inSplat = true;
      break;
    case ' ':
      if (inArg) {
        addArg();
      }
      break;
    default:
      if (inArg) {
        buffer += str[i];
      }
      break;
    }

    i += 1;
  }


  if (buffer.length > 0) {
    if (inArg) {
      addArg();
    }
  }

  return argMap;
}

function parseSignature(str) {
  let i = 0;
  let end = str.length;
  const argMap = [];

  let buffer = '';
  let inArg = false;
  let inOpt = false;
  let inSplat = false;
  let inMulti = false;

  const addArg = () => {
    if (inSplat && inMulti) {
      throw new Error(`Error at index ${i} - param is both splat and multiple`);
    }

    const obj = {
      name: buffer,
      optional: inOpt,
      multiple: inMulti,
      splat: inSplat,
    };

    argMap.push(obj);
    buffer = '';

    inArg = false;
    inOpt = false;
    inSplat = false;
    inMulti = false;
  };

  while (i < end) {
    switch (str[i]) {
    case '<':
      inArg = true;
      inOpt = false;
      break;
    case '>':
      addArg();
      break;
    case '[':
      inArg = true;
      inOpt = true;
      break;
    case ']':
      addArg();
      break;
    case '.':
      if (inArg && buffer.length > 0) {
        let eq = str[i] === '.'
              && str[i+1] === '.'
              && str[i+2] === '.';

        if (eq) {
          i += 2;
          inMulti = true;
        }
      }
      break;
    case '*':
      if (inArg && buffer.length === 0) {
        // If '*' is the first thing to appear in the name
        inSplat = true;
      }
      break;
    case ' ':
      break;
    default:
      if (inArg) {
        buffer += str[i];
      }
      break;
    }

    i += 1;
  }


  if (buffer.length > 0) {
    if (inArg) {
      addArg();
    }
  }

  return argMap;
}

function mapArgs(args, argMap) {
  // Using a command's argMap, map the args to their proper names.

  const mapped = {};

  argMap.forEach((arg, i) => {
    if (args[i]) {
      if (arg.splat) {
        mapped[arg.name] = args.slice(i).join(' ');
      } else if (arg.multiple) {
        mapped[arg.name] = args.slice(i);
      } else {
        mapped[arg.name] = args[i];
      }
    }
  });

  return mapped;
}

function requiredArgsProvided(mappedArgs, argMap) {
  // Make sure the non-optional args are all supplied.

  for (let i = 0; i < argMap.length; i++) {
    const marg = argMap[i];
    if (!marg.optional && !mappedArgs[marg.name]) {
      return false;
    }
  }

  return true;
}

function formatSentence(str) {
  let sentence = str[0].toUpperCase() + str.slice(1);
  if (sentence[sentence.length - 1] !== '.') {
    sentence += '.';
  }

  return sentence;
}

function toSnakeCase(str) {
  return str.replace(/([a-z][A-Z])/g, cap => cap[0] + '_' + cap[1].toLowerCase());
}

function makeHelp(programName, command, argMap, mapped) {
  let str = '\n';

  str += `Usage: ${programName} ${command}`;

  argMap.forEach(arg => {
    let argStr = ' ';
    let name = toSnakeCase(arg.name);
    if (arg.splat) {
      name += '...';
    }

    if (arg.optional) {
      argStr += `[${name}]`;
    } else {
      argStr += `<${name}>`;
    }

    // Highlight in red if this arg was missed.
    if (!mapped[arg.name]) {
      if (arg.optional) {
        str += chalk.bold.yellow(argStr);
      } else {
        str += chalk.bold.red(argStr);
      }
    } else {
      str += argStr;
    }
  });

  return str + '\n';
}

function makeGeneralHelp(program, commands) {
  let str = '\n';

  str += '  ' + program.name + ' v' + program.version + '\n\n';
  str += chalk.bold('  Commands:') + '\n';

  for (const cmd in commands) {
    const { signature, purpose } = commands[cmd];

    str += `    ${toSnakeCase(signature)}\n`;
    if (purpose) {
      str += '      ' + chalk.italic.grey(formatSentence(purpose)) + '\n';
    }
  }

  return str += '\n';
}

function CLI(program) {
  const commands = {};

  const command = (signature, purpose, callback) => {
    if (typeof purpose === 'function' && !callback) {
      callback = purpose;
      purpose = null;
    }

    const command = signature.split(' ')[0];

    commands[command] = {
      signature,
      purpose,
      args: parseSignature(signature),
      fn: callback,
    };
  };

  const run = (args) => {
    const command = args[0];
    const cmd = commands[command];

    if (!cmd || command.toLowerCase() === 'help') {
      return console.log(makeGeneralHelp(program, commands));
    }

    const mapped = mapArgs(args.slice(1), cmd.args);

    if (!requiredArgsProvided(mapped, cmd.args)) {
      return console.log(makeHelp(program.name, command, cmd.args, mapped));
    }

    return cmd.fn.call(null, mapped);
  };

  const invoke = (command, args) => {
    // Invoke another command with the given args array.
    run([].concat(command.split(' '), args || []));
  };

  return { command, run, invoke };
}

// Expose for testing.
CLI.___ = {
  parseSignature,
  mapArgs,
  requiredArgsProvided
};

module.exports = CLI;