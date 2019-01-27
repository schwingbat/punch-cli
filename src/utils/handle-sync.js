module.exports = async function handleSync ({ silent, config, Punch } = {}) {
  if (config.autoSync) {
    const Syncer = require("../sync/syncer");
    return new Syncer(config, Punch).syncAll({ silent, auto: true });
  } else {
    return Promise.resolve();
  }
};