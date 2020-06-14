const storage = require("../storage");
const EventEmitter = require("events");
const readline = require("readline-sync");
const logUpdate = require("log-update");

const { Command } = require("@ratwizard/cli");

module.exports = new Command()
  .description("convert punch data from one format to another")
  .examples(["{*} sqlite ledger"])
  .arg("srcFormat", {
    description: "storage backend to convert from",
  })
  .arg("destFormat", {
    description: "storage backend to convert to",
  })
  .action(async ({ args, props }) => {
    const { srcFormat, destFormat } = args;
    const { config, Punch } = props;

    const srcStorage = loadStorageBackend(config, Punch, srcFormat);
    const destStorage = loadStorageBackend(config, Punch, destFormat);

    const loaded = await srcStorage.filter(() => true);

    let message = `Copy ${loaded.length} punches from backend '${srcStorage.name}' to '${destStorage.name}'?`;

    if (readline.keyInYN(message)) {
      for (let i = 0; i < loaded.length; i++) {
        await destStorage.save(loaded[i]);
        const pasento = (((i + 1) / loaded.length) * 100).toFixed(0);
        logUpdate(
          `Migrated ${i + 1} of ${loaded.length} punches (${pasento}%)`
        );
      }

      logUpdate(
        `Migrated ${loaded.length} punches. You can now change storageType to '${destFormat}' in your config file.`
      );
    }
  });

function loadStorageBackend(config, Punch, name) {
  const backend = storage({ ...config, storageType: name });
  if (!backend) {
    throw new Error(`Storage backend ${name} doesn't exist.`);
  }

  const events = new EventEmitter();

  return backend(Punch, events);
}
