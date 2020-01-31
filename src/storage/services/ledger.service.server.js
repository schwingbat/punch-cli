module.exports = function(config, Punch) {
  const path = require("path");
  const fs = require("fs");
  const { descendingBy } = require("../../utils/sort-factories");

  const ledgerPath = path.join(config.punchPath, "punches.ledger");

  let hasChanges = false;
  let punches = [];

  /**
   * Saves happen in memory and queue a save, to prevent the need to dump all punches
   * on every update. Saved punches live in memory until persisted to disk on a timer.
   *
   * The CLI shouldn't
   */
  let queuedSave = null;

  function writeToDisk() {
    if (hasChanges) {
      let str = punches
        .filter(p => p != null)
        .map(encodePunch)
        .join("\n");

      fs.writeFileSync(ledgerPath, str);
    }
  }

  /**
   * Queue a save if one is not already queued.
   */
  function queueSave() {
    if (queuedSave) {
      clearTimeout(queuedSave);
    }

    queuedSave = setTimeout(() => {
      writeToDisk();
      queuedSave = null;
    }, 100);
  }

  function encodePunch(punch) {
    if (punch.deleted) {
      return JSON.stringify({ id: punch.id, deleted: true });
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

  if (fs.existsSync(ledgerPath)) {
    const file = fs.readFileSync(ledgerPath, "utf8");
    punches = file.split("\n").map(decodePunch);
  }

  return {
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

      queueSave();
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

    // Returns an array of punches for which the passed
    // function returns true. Like 'filter'
    async select(fn) {
      return punches.filter(p => !p.deleted && fn(p));
    },

    // Deletes a given punch
    async delete(punch) {
      for (let i = 0; i < punches.length; i++) {
        if (punches[i].id === punch.id && !punches[i].deleted) {
          punches[i].deleted = true;
          hasChanges = true;
          queueSave();
          return;
        }
      }
    },

    // Called before the program exits.
    // Close connections and do any necessary cleanup.
    async cleanUp() {
      writeToDisk();
    }
  };
};
