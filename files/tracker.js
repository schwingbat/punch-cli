// The tracker file keeps track of the current state
// so we don't have to go searching through all the
// punchfiles to figure out what's happening.

const lazy = require('../lazy.js');

module.exports = function Tracker(config) {
  const fs = lazy.load('fs');
  const path = lazy.load('path');
  
  let active;
  let sync;

  try {
    const file = JSON.parse(fs.readFileSync(config.trackerPath, 'utf8'));
    active = file.active;
    sync = file.sync;
  } catch (err) {
    active = null;
  }

  if (!sync) {
    sync = {
      last: null,
      changes: 0,
    }
  }

  const save = () => {
    fs.writeFileSync(config.trackerPath, JSON.stringify({
      updated: Date.now(),
      active,
      sync,
    }, null, 2));
  };

  return {
    setActive(project) {
      active = {
        project,
        timestamp: Date.now(),
      };

      save();
    },
    getActive() {
      return active;
    },
    clearActive() {
      active = null;

      save();
    },
    hasActive() {
      return !!active;
    },
    isActive(project) {
      return active && active.project === project;
    },
    resetSync() {
      sync.last = Date.now();
      sync.changes = 0;
      save();
    },
    incrementSync(count = 1) {
      sync.changes = (sync.changes || 0) + count;
      save();
    },
    unsynced() {
      return sync.changes;
    },
    lastSync() {
      return sync.last;
    },
  }
}
