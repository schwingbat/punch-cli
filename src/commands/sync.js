const updateCurrentMarker = require("../utils/update-current-marker");
const Syncer = require("../sync/syncer");

module.exports = command =>
  command
    .description("synchronize with any services in your config file")
    .arg("services", {
      description:
        "list of services to sync with (matches label or service name)",
      optional: true,
      splat: true
    })
    .run(async ({ args, props }) => {
      const { config, Punch } = props;

      const syncer = new Syncer(config, Punch);

      await syncer.syncAll(
        args.services || config.sync.services.map(s => s.name)
      );

      updateCurrentMarker(config, await Punch.current());
    });
