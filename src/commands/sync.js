const updateCurrentMarker = require("../utils/update-current-marker");
const Syncer = require("../sync/syncer");

module.exports = command =>
  command
    .description("synchronize with configured backends")
    .run(async ({ props }) => {
      const { config, Punch } = props;

      const syncer = new Syncer(config, Punch);
      const services = config.sync.services.filter(s => s.enabled);

      await syncer.syncAll(services);

      updateCurrentMarker(config, await Punch.current());
    });
