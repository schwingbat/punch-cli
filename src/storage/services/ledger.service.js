module.exports = function(config, Punch, events) {
  const path = require("path");
  const fs = require("fs");
  const chokidar = require("chokidar");
  const { descendingBy } = require("../../utils/sort-factories");

  const ledgerPath = path.join(config.punchPath, "punches.ledger");

  let lastWritten = null;
  let hasChanges = false;
  let punches = [];

  function encodePunch(punch) {
    if (punch.deleted) {
      return JSON.stringify({
        id: punch.id,
        deleted: true
      });
    } else {
      return JSON.stringify(punch.toJSON());
    }
  }

  function decodePunch(punch) {
    const json = JSON.parse(punch);

    if (json.deleted) {
      return {
        id: json.id,
        deleted: true
      };
    } else {
      return new Punch(json);
    }
  }

  const load = () => {
    if (fs.existsSync(ledgerPath)) {
      const file = fs.readFileSync(ledgerPath, "utf8");
      punches = file.split("\n").map(decodePunch);
    }
  };

  // Load once on init.
  load();

  // Watch for and reload on file changes when the server is running.
  events.on("server:started", () => {
    const watcher = chokidar.watch(ledgerPath);

    watcher.on("change", path => {
      const writtenAt = fs.lstatSync(path).mtimeMs;

      if (writtenAt !== lastWritten) {
        // Reload from disk. The time is different than our last write, so it wasn't us.
        load();
      }
    });

    events.once("willexit", () => {
      watcher.close();
    });
  });

  const public = {
    name: "ledger",

    // Saves a single punch object
    async save(punch) {
      let currentIndex;

      for (let i = 0; i < punches.length; i++) {
        if (!punches[i].deleted && punches[i].id === punch.id) {
          currentIndex = i;
          break;
        }
      }

      if (currentIndex) {
        punches[currentIndex] = punch;
      } else {
        punches.push(punch);
      }

      hasChanges = true;
    },

    // Returns the currently running punch (or null)
    // Optionally filters by project
    async current(project) {
      for (let i = 0; i < punches.length; i++) {
        if (
          !punches[i].deleted &&
          punches[i].out == null &&
          (!project || punches[i].project === project)
        ) {
          return punches[i];
        }
      }

      return null;
    },

    // Returns the most recent punch
    // Optionally filters by project
    async latest(project) {
      return punches
        .map(p => p)
        .sort(descendingBy("in"))
        .find(p => !p.deleted && (!project || p.project === project));
    },

    async select(fn) {
      return this.filter(fn);
    },

    // Returns an array of punches for which the passed function returns true.
    async filter(fn) {
      return punches.filter(p => !p.deleted && fn(p));
    },

    async find(fn) {
      return punches.find(p => !p.deleted && fn(p));
    },

    // Deletes a given punch
    async delete(punch) {
      for (let i = 0; i < punches.length; i++) {
        if (punches[i].id === punch.id && !punches[i].deleted) {
          punches[i].deleted = true;
          hasChanges = true;
          return;
        }
      }
    },

    // Write any pending changes to disk.
    async commit() {
      if (hasChanges) {
        let str = punches
          .filter(p => p != null)
          .map(encodePunch)
          .join("\n");

        fs.writeFileSync(ledgerPath, str);

        lastWritten = fs.lstatSync(ledgerPath).mtimeMs;
      }
    },

    // Called before the program exits.
    // Close connections and do any necessary cleanup.
    async cleanUp() {
      // this.commit();
    }
  };

  // Commit any pending changes before the program exits.
  events.on("willexit", () => {
    public.commit();
  });

  // Commit any time a punch or batch of punches is updated.
  events.on("server:punchupdated", () => {
    public.commit();
  });

  return public;
};
