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

bench.mark("punch loaded");

/* ========================= *\
||          Commands         ||
\* ========================= */

const program = new Command({
  version: pkg.version,
  props: {
    events,
    config,
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
  });

// ----- Managing Comments ----- //

program
  .command("comment <text...>", {
    description: "add a comment to the current punch",
    path: "./commands/comment",
  })
  .command("comment:add <id> <text...>", {
    description: "add a comment to an existing punch",
    path: "./commands/comment-add",
  })
  .command("comment:delete <id> <index>", {
    description: "delete a punch comment",
    path: "./commands/comment-delete",
  })
  .command("comment:edit <id> <index> <text...>", {
    description: "edit a comment on an existing punch",
    path: "./commands/comment-edit",
  });

// ----- Managing Tags ----- //

program.command("tags", {
  description: "view and manage comment tags",
  path: "./commands/tags",
});

// ----- Logging ----- //

program.command("log [when...]", {
  description: "show punches for a date range",
  path: "./commands/log",
});

// ----- Data Import/Export ----- //

program
  .command("import", {
    description: "import punch data from other sources",
    path: "./commands/import",
  })
  .command("export", {
    description: "export punch data to other destinations",
    path: "./commands/export",
  })
  .command("invoice", {
    description: "generate an invoice",
    path: "./commands/invoice",
  })
  .command("sync", {
    description: "synchronize with an external source or server",
    path: "./commands/sync",
  });

// ----- Managing Projects ----- //

program
  .command("projects", {
    description: "view a summary of projects",
    path: "./commands/projects",
  })
  .command("project:rename", {
    description: "change a project's alias and update punches",
    path: "./commands/project-rename",
  })
  .command("project:purge", {
    description: "delete all punches for a certain project",
    path: "./commands/project-purge",
  })
  .command("project:rerate", {
    description: "update existing punches with a new pay rate",
    path: "./commands/project-rerate",
  });

// ----- Misc ----- //

program
  .command("watch", {
    description: "show your current punch in realtime",
    path: "./commands/watch",
  })
  .command("config", {
    description: "edit your punch configuration",
    path: "./commands/config",
  });

// ----- Server ----- //

program
  .command("serve", {
    description: "start a server with a web-based UI",
    path: "./commands/serve",
  })
  .command("server:hash", {
    description: "hash a password to be used for login on the server",
    path: "./commands/server-hash",
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
