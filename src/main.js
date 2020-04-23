#!/usr/bin/env node

global.appRoot = __dirname;

const pkg = require("../package.json");

const BENCHMARK = process.argv.includes("--benchmark");

if (BENCHMARK) {
  require("time-require");
}

const { Command } = require("@ratwizard/cli");

const hammerspoon = require("./utils/hammerspoon");
const EventEmitter = require("events");
const bench = require("./utils/bench")({ disabled: !BENCHMARK });
const config = require("./config").load();

bench.mark("config loaded");

const events = new EventEmitter();
const Punch = require("./punch/punch")(config);

const storage = require("./storage")(config)(Punch, events);
Punch.setStorage(storage);

const consolePrinter = require("./printing/printers/console");
const print = require("./printing")({
  printer: consolePrinter(),
  config,
});

const input = require("./input");

bench.mark("punch loaded");

/* ========================= *\
||          Commands         ||
\* ========================= */

const program = new Command({
  version: pkg.version,
  props: {
    events,
    config,
    print,
    input,
    Punch,
  },
});

// ----- Managing Punches ----- //

program
  .command("in <project>", {
    description: "begin tracking time",
    path: "./commands/in",
  })
  .command("out [project]", {
    description: "stop tracking time",
    path: "./commands/out",
  })
  .command("create <project>", {
    description: "create a new punch with a start and end date",
    path: "./commands/create",
  })
  .command("delete <id>", {
    description: "delete a punch",
    path: "./commands/delete",
  })
  .command("adjust <id>", {
    description: "adjust a punch's start and end date",
    path: "./commands/adjust",
  })

  // ----- Logging ----- //

  .command("log [when...]", {
    description: "show punches for a date range",
    path: "./commands/log",
  })

  // ----- Managing Tags ----- //

  .command("tags", {
    description: "view and manage comment tags",
    path: "./commands/tags",
  })

  // ----- Misc ----- //

  .command("sync", {
    description: "synchronize with an external source or server",
    path: "./commands/sync",
  })
  .command("watch", {
    description: "show your current punch in realtime",
    path: "./commands/watch",
  })
  .command("invoice", {
    description: "generate an invoice",
    path: "./commands/invoice",
  })
  .command("config", {
    description: "edit your punch configuration",
    path: "./commands/config",
  })

  // ----- Managing Comments ----- //

  .command("comment <text...>", {
    description: "add a comment to the current punch",
    path: "./commands/comment",
  })
  .command("comment:add <id> <text...>", {
    description: "add a comment to an existing punch",
    path: "./commands/comment_add",
  })
  .command("comment:edit <id> <index> <text...>", {
    description: "edit a comment on an existing punch",
    path: "./commands/comment_edit",
  })
  .command("comment:delete <id> <index>", {
    description: "delete a punch comment",
    path: "./commands/comment_delete",
  })

  // ----- Managing Projects ----- //

  .command("project:list", {
    description: "view a summary of projects",
    path: "./commands/project_list",
  })
  .command("project:rename", {
    description: "change a project's alias and update punches",
    path: "./commands/project_rename",
  })
  .command("project:rerate", {
    description: "update existing punches with a new pay rate",
    path: "./commands/project_rerate",
  })
  .command("project:purge", {
    description: "delete all punches for a certain project",
    path: "./commands/project_purge",
  })

  // ----- Data Import/Export ----- //

  .command("data:import", {
    description: "import punch data from other sources",
    path: "./commands/data_import",
  })
  .command("data:export", {
    description: "export punch data to other destinations",
    path: "./commands/data_export",
  })

  // ----- Server ----- //

  .command("server:hash", {
    description: "hash a password to be used for login on the server",
    path: "./commands/server-hash",
  })
  .command("serve", {
    description: "start a server with a web-based UI",
    path: "./commands/serve",
  });

// ----- Lifecycle ----- //

let isPersistent = false;

events.on("server:started", () => {
  isPersistent = true;
});

events.on("watch:started", () => {
  isPersistent = true;
});

// Write hammerspoon.json when data changes.
// TODO: Repackage this as an optional plugin
events.on("willexit", async () => {
  await hammerspoon(config, Punch);
});

events.on("server:punchupdated", async () => {
  await hammerspoon(config, Punch);
});

program.run(process.argv).then(() => {
  if (!isPersistent) {
    exitHandler({ exit: true });
  }
});

// Exit cleanup

async function exitHandler(options) {
  bench.mark("parsed and run");
  bench.printAll();

  if (options.exit) {
    events.emit("willexit");
    hammerspoon(config, Punch).then(() => {
      process.exit();
    });
  }
}

process.on("exit", exitHandler.bind(null, { cleanup: true }));
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));

// ctrl + c
process.on("SIGINT", exitHandler.bind(null, { exit: true }));

// kill pid (e.g. nodemon restart, killall node)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));
