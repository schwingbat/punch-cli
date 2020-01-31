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

command("create")
  .fromPath(__dirname, "commands/create")
  .withProps(props);

command("delete")
  .fromPath(__dirname, "commands/delete")
  .withProps(props);

command("adjust")
  .fromPath(__dirname, "commands/adjust")
  .withProps(props);

// ----- Managing Comments ----- //

command("comment")
  .fromPath(__dirname, "commands/comment")
  .withProps(props);

// command("comment:add")
//   .fromPath(__dirname, "commands/comment-add")
//   .withProps(props);

// command("comment:delete")
//   .fromPath(__dirname, "commands/comment-delete")
//   .withProps(props);

// command("comment:replace")
//   .fromPath(__dirname, "commands/comment-replace")
//   .withProps(props);

// ----- Managing Tags ----- //

command("tags")
  .fromPath(__dirname, "commands/tags")
  .withProps(props);

// ----- Logging ----- //

command("log")
  .fromPath(__dirname, "commands/log")
  .withProps(props);

// ----- Data Import/Export ----- //

// command("import")
//   .fromPath(__dirname, "commands/import")
//   .withProps(props);

// command("export")
//   .fromPath(__dirname, "commands/export")
//   .withProps(props);

command("invoice")
  .fromPath(__dirname, "commands/invoice")
  .withProps(props);

command("sync")
  .fromPath(__dirname, "commands/sync")
  .withProps(props);

// ----- Managing Projects ----- //

command("projects")
  .fromPath(__dirname, "commands/projects")
  .withProps(props);

// command("project:rename")
//   .fromPath(__dirname, "commands/project-rename")
//   .withProps(props);

// command("project:purge")
//   .fromPath(__dirname, "commands/project-purge")
//   .withProps(props);

// ----- Misc ----- //

command("watch")
  .fromPath(__dirname, "commands/watch")
  .withProps(props);

command("config")
  .fromPath(__dirname, "commands/config")
  .withProps(props);

// command(require("./commands/migrate-from-sqlite")(props));
// command(require("./commands/timestamp")(props));
// command(require("./commands/rename-comment-object")(props));
// command(require("./commands/adjust-rate")(props));

invoke();

// Exit cleanup

async function exitHandler(options) {
  await Punch.storage.cleanUp();

  bench.mark("parsed and run");
  bench.printAll();

  if (options.exit) process.exit();
}

process.on("exit", exitHandler.bind(null, { cleanup: true }));
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));

// ctrl + c
process.on("SIGINT", exitHandler.bind(null, { exit: true }));

// kill pid (e.g. nodemon restart, killall node)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));
