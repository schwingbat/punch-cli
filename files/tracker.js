// The tracker file keeps track of the current state
// so we don't have to go searching through all the 
// punchfiles to figure out what's happening.

const fs = require('fs');
const path = require('path');

module.exports = function Tracker(config) {
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
      active,
      sync,
    }, null, 2));
  };

  return {
    active,
    sync,
    setActive(project) {
      active = {
        project,
        timestamp: Date.now(),
      };

      save();
    },
    clearActive() {
      active = null;

      save();
    },
    resetSync() {
      sync.last = Date.now();
      sync.changes = 0;
      save();
    },
    incrementSync() {
      sync.changes = (sync.changes || 0) + 1;
      save();
    },
    hasActive() {
      return !!active;
    },
    hasUnsyncedChanges() {
      return sync.changes > 0;
    },
    lastSyncTime() {
      return sync.last;
    },
    isActive(project) {
      return active && active.project === project;
    },
    getActive(project) {
      return active;
    },
  }
}