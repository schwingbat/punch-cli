#!/usr/bin/env node

global.appRoot = __dirname;

const pkg = require("../package.json");

const BENCHMARK = process.argv.includes("--benchmark");

if (BENCHMARK) {
  require("time-require");
}

const { command, invoke } = require("@ratwizard/cli")({
  name: "punch",
  version: pkg.version,
  author: "Tony McCoy <tony@ratwizard.io>"
});

const bench = require("./utils/bench")({ disabled: !BENCHMARK });
const config = require("./config").load();

bench.mark("config loaded");

const Storage = require("./storage")(config);
const Punch = require("./punch/punch")(config, Storage);

bench.mark("punch loaded");

/* ========================= *\
||          Commands         ||
\* ========================= */

const props = {
  config,
  Punch,
  Storage
};

// ----- Managing Punches ----- //

command("in")
  .fromPath(__dirname, "commands/in")
  .withProps(props);

command("out")
  .fromPath(__dirname, "commands/out")
  .withProps(props);

// command("create")
//   .fromPath("./commands/create")
//   .withProps(props);

// command("delete")
//   .fromPath("./commands/delete")
//   .withProps(props);

// command("adjust")
//   .fromPath("./commands/adjust")
//   .withProps(props);

// ----- Managing Comments ----- //

command("comment")
  .fromPath(__dirname, "commands/comment")
  .withProps(props);

// command(require("./commands/add-comment")(props));
// command(require("./commands/delete-comment")(props));
// command(require("./commands/replace-comment")(props));

// ----- Managing Tags ----- //

// command(require("./commands/tags")(props));

// ----- Logging ----- //

command("log")
  .fromPath(__dirname, "commands/log")
  .withProps(props);

// command(require("./commands/invoice")(props));

command("sync")
  .fromPath(__dirname, "commands/sync")
  .withProps(props);

// ----- Data Import/Export ----- //

// command(require("./commands/import")(props));
// command(require("./commands/export")(props));

// ----- Managing Projects ----- //

command("projects")
  .fromPath(__dirname, "commands/projects")
  .withProps(props);

// command(require("./commands/rename-project")(props));
// command(require("./commands/purge-project")(props));

// ----- Misc ----- //

// command(require("./commands/migrate-from-sqlite")(props));
// command(require("./commands/timestamp")(props));

command("watch")
  .fromPath(__dirname, "commands/watch")
  .withProps(props);

command("config")
  .fromPath(__dirname, "commands/config")
  .withProps(props);

// command(require("./commands/rename-comment-object")(props));
// command(require("./commands/adjust-rate")(props));

invoke();

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
