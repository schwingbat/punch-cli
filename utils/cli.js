const chalk = require('chalk');

function parseCmdString(str) {
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

function mapArgs(args, argMap) {
  // Using a command's argMap, map the args to their proper names.

  const mapped = {};

  argMap.forEach((arg, i) => {
    if (args[i]) {
      if (arg.splat) {
        mapped[arg.name] = args.slice(i).join(' ');
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

function makeHelp(programName, command, argMap, mapped) {
  let str = '\n';

  str += 'Usage: ' + programName + ' ' + command;

  argMap.forEach(arg => {
    let argStr = ' <';
    // if (arg.splat) {
    //   argStr += '...';
    // }
    argStr += arg.name;
    if (arg.optional) {
      argStr += '?';
    }
    argStr += '>';

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
    const c = commands[cmd];

    str += '    ';
    str += cmd;
    c.args.forEach(arg => {
      str += ' <';
      // if (arg.splat) {
      //   str += '...';
      // }
      str += arg.name;
      if (arg.optional) {
        str += '?';
      }
      str += '>';
    });
    str += '\n';

    if (c.purpose) {
      c.purpose = c.purpose[0].toUpperCase() + c.purpose.slice(1);
      if (c.purpose[c.purpose.length - 1] !== '.') {
        c.purpose += '.';
      }

      str += '      ';
      str += chalk.italic.grey(c.purpose);
      str += '\n';
    }
  }

  return str += '\n';
}

function CLI(program) {
  const commands = {};

  const command = (cmd, purpose, callback) => {
    if (typeof purpose === 'function' && !callback) {
      callback = purpose;
      purpose = null;
    }

    const command = cmd.split(' ')[0];
    const parsed = parseCmdString(cmd);

    commands[command] = {
      args: parsed,
      purpose,
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
  parseCmdString,
  mapArgs,
  requiredArgsProvided
};

module.exports = CLI;