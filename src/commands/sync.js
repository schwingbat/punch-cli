const updateCurrentMarker = require("../utils/update-current-marker");
const Syncer = require("../sync/syncer");

const { Command } = require("@ratwizard/cli");

module.exports = new Command("sync")
  .description("synchronize with configured backends")
  .action(async ({ props }) => {
    const { config, Punch } = props;

    const syncer = new Syncer(config, Punch);
    const services = config.sync.services.filter(s => s.enabled);

    await syncer.syncAll(services);

    updateCurrentMarker(config, await Punch.current());
  });
