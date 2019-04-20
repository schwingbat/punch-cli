#!/usr/bin/env node

global.appRoot = __dirname;

const CLI = require("./utils/cli/index.js");
const pkg = require("../package.json");

const { command, run } = CLI({
  name: "punch",
  version: pkg.version
});

const flags = {
  VERBOSE: false,
  BENCHMARK: false,
  NO_SYNC: false
};

// Process command line args into params/flags

const ARGS = process.argv.slice(2);

for (let i = 0; i < ARGS.length; i++) {
  const arg = ARGS[i];

  if (arg[0] === "-") {
    switch (arg.toLowerCase()) {
      case "-v":
      case "--version":
        console.log("punch v" + pkg.version);
        process.exit();
        break;
      case "--verbose":
        flags.VERBOSE = true;
        break;
      case "-b":
      case "--benchmark":
        flags.BENCHMARK = true;
        require("time-require");
        break;
      case "-ns":
      case "--nosync":
      case "--no-sync":
        flags.NO_SYNC = true;
        break;
    }
  }
}

const bench = require("./utils/bench")({ disabled: !flags.BENCHMARK });
const config = require("./config")();

bench.mark("config loaded");

const Storage = require("./storage")(config);
const Punch = require("./punch/punch")(config, Storage);

bench.mark("punch loaded");

/* ========================= *\
||          Commands         ||
\* ========================= */

// Each command is a closure that takes config objects and returns a CLI
// command object.

const injectables = {
  config,
  Punch,
  Storage
};

// ----- Managing Punches ----- //

command(require("./commands/in")(injectables));
command(require("./commands/out")(injectables));
command(require("./commands/create")(injectables));
command(require("./commands/delete")(injectables));
command(require("./commands/adjust")(injectables));

// ----- Managing Comments ----- //

command(require("./commands/comment")(injectables));
command(require("./commands/add-comment")(injectables));
command(require("./commands/delete-comment")(injectables));
command(require("./commands/replace-comment")(injectables));

// ----- Managing Tags ----- //

command(require("./commands/tags")(injectables));

// ----- Logging ----- //

command(require("./commands/log")(injectables));
command(require("./commands/today")(injectables));
command(require("./commands/yesterday")(injectables));
command(require("./commands/week")(injectables));
command(require("./commands/month")(injectables));

command(require("./commands/invoice")(injectables));
command(require("./commands/sync")(injectables));

// ----- Data Import/Export ----- //

command(require("./commands/import")(injectables));
command(require("./commands/export")(injectables));

// ----- Managing Projects ----- //

command(require("./commands/projects")(injectables));
command(require("./commands/rename-project")(injectables));
command(require("./commands/purge-project")(injectables));

// ----- Misc ----- //

command(require("./commands/migrate-from-sqlite")(injectables));
command(require("./commands/timestamp")(injectables));
command(require("./commands/watch")(injectables));
command(require("./commands/config")(injectables));
command(require("./commands/rename-comment-object")(injectables));
command(require("./commands/adjust-rate")(injectables));

run(ARGS);

bench.mark("parsed and run");
bench.printAll();

// Exit cleanup

async function exitHandler(options) {
  await Punch.storage.cleanUp();

  if (options.exit) process.exit();
}

process.on("exit", exitHandler.bind(null, { cleanup: true }));
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));

// ctrl + c
process.on("SIGINT", exitHandler.bind(null, { exit: true }));

// kill pid (e.g. nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));
