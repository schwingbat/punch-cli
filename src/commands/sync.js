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

    await new Syncer(config, Punch).syncAll({
      services: args.services,
      check: args.options.check || false
    });

    updateCurrentMarker(config, await Punch.current());
  }
});
