module.exports = ({ config, Punch }) => ({
  signature: "sync [services...]",
  description: "synchronize with any services in your config file",
  arguments: [
    {
      name: "services",
      description:
        "list of services to sync with (matches label or service name)"
    }
  ],
  options: [
    {
      name: "check",
      short: "c",
      description: "check for differences but don't upload or download",
      type: "boolean"
    }
  ],
  run: async function(args) {
    const updateCurrentMarker = require("../utils/update-current-marker");
    const Syncer = require("../sync/syncer");
    const syncer = new Syncer(config, Punch);

    await syncer.syncAll(
      args.services || config.sync.services.map(s => s.name)
    );

    updateCurrentMarker(config, await Punch.current());
  }
});
