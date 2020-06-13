const path = require("path");
const fs = require("fs");

function Syncer(config, Punch) {
  if (!config) {
    throw new Error("Syncer requires a config object as the first parameter");
  }
  if (!Punch) {
    throw new Error(
      "Syncer requires the Punch constructor to be passed as the second parameter"
    );
  }

  function loadService(conf) {
    const name = conf.type.toLowerCase();
    conf.credentials = loadCredentials(conf, config.configPath);

    // Try loading from user's config path where custom sync handlers can be defined.
    // If nothing is found there try loading a built in handler.

    const localPath = path.join(__dirname, "handlers", `${name}.js`);
    const userPath = path.join(
      config.configPath,
      "sync",
      "handlers",
      `${name}.js`
    );

    if (fs.existsSync(userPath)) {
      return require(userPath)(conf, Punch);
    }

    if (fs.existsSync(localPath)) {
      return require(localPath)(conf, Punch);
    }

    throw new Error(
      `Sync service ${serviceName} is not supported yet, but you can add support yourself: https://punch.sh/docs/sync#handlers`
    );
  }

  /**
   * Determines changes between local punches and a manifest of remote punches from the sync target.
   *
   * @param {{ [id: string]: Date }} manifest - Manifest of IDs and updated dates for punches from a remote source.
   * @returns an object containing punches to be uploaded and punch IDs to be downloaded.
   */
  async function diff(manifest) {
    const punches = await Punch.all();

    // Punches should be uploaded if they don't exist remotely or if the local copy is newer.
    const uploads = punches.filter((punch) => {
      return (
        !manifest.hasOwnProperty(punch.id) || manifest[punch.id] < punch.updated
      );
    });

    // Punches should be downloaded if they don't exist locally or if the remote copy is newer.
    const downloads = [];
    for (const id in manifest) {
      const punch = punches.find((p) => p.id === id);
      if (!punch || punch.updated < manifest[id]) {
        downloads.push(id);
      }
    }

    // Delete a punch if the manifest has the literal null value instead of a timestamp
    const deletions = punches.filter((punch) => {
      return manifest[punch.id] === null;
    });

    return { uploads, downloads, deletions };
  }

  async function sync(service) {
    if (!service || !service.getManifest) {
      throw new Error(`Parameter is not a valid sync service`);
    }

    try {
      const manifest = await service.getManifest();
      const result = await diff(manifest);

      const { uploads, downloads } = result;

      const uploaded = await service.upload(uploads, manifest);
      const downloaded = await service.download(downloads);

      for (let i = 0; i < downloaded.length; i++) {
        await downloaded[i].save();
      }

      return { uploaded, downloaded };
    } catch (err) {
      console.error(err);
      const label = service.config.label || service.config.name;
      const message = `[${label}] Sync Error: ${err.message}`;
      throw new Error(message);
    }
  }

  async function syncAll(services) {
    /**
     * Multi-sync
     * - Get all manifests
     * - Compare manifests and local against each other
     * - Build upload/download lists for each service
     * - Order requests so newest punches are fetched first

     * For now it's just single sync at a time
     */

    const loader = require("../utils/loader")();
    const { symbols } = config;

    const { grey, magenta, cyan, green } = require("chalk");

    for (const conf of services) {
      if (!conf.enabled) {
        continue;
      }

      const service = loadService(conf);

      loader.start("Syncing with " + conf.name + "...");

      // const uploader = loader();
      // const downloader = loader();

      const up = (value) =>
        `${grey("[")}${magenta(symbols.syncUpload)} ${value}${grey("]")}`;
      const down = (value) =>
        `${grey("[")}${cyan(symbols.syncDownload)} ${value}${grey("]")}`;

      // loader.stop(
      //   `${green(
      //     symbols.syncSuccess
      //   )} ${up}${down} ${message} (${elapsed.toFixed(2)}s)`
      // );

      // service.events.on("upload:start", data => {
      //   uploader.start(up(`0 of ${data.total}`));
      // });
      // service.events.on("upload:progress", data => {
      //   uploader.update(up(`${data.progress} of ${data.total}`));
      // });
      // service.events.on("upload:end", data => {
      //   uploader.stop("");
      // });

      // service.events.on("download:start", data => {
      //   downloader.start(down(`0 of ${data.total}`));
      // });
      // service.events.on("download:progress", data => {
      //   downloader.update(down(`${data.progress} of ${data.total}`));
      // });
      // service.events.on("download:end", data => {
      //   downloader.stop("");
      // });

      const { uploaded, downloaded } = await sync(service);

      loader.stop(
        `${green(symbols.syncSuccess)} ${up(uploaded.length)}${down(
          downloaded.length
        )} Synced with ${conf.name}`
      );
    }
  }

  return {
    sync,
    syncAll,
    diff,
  };
}

module.exports = Syncer;

/*==========================*\
||    Credential Loaders    ||
\*==========================*/

function loadCredentials(config, punchConfigPath) {
  const { credentials } = config;

  if (typeof credentials === "object" && !Array.isArray(credentials)) {
    return credentials;
  } else if (typeof credentials === "string") {
    let credentialsPath = credentials;

    if (!path.isAbsolute(credentialsPath)) {
      credentialsPath = path.resolve(
        path.dirname(punchConfigPath),
        credentialsPath
      );
    }

    if (fs.existsSync(credentialsPath)) {
      const ext = path.extname(credentialsPath).toLowerCase();
      const read = fs.readFileSync(credentialsPath, "utf8");

      let parsed;

      try {
        switch (ext) {
          case ".json":
            parsed = JSON.parse(read);
            break;
          default:
            throw new Error(
              `${ext} files are not supported as credential sources - must be .json`
            );
        }
      } catch (err) {
        throw new Error(
          "There was a problem reading the credentials file: " + err
        );
      }

      return parsed;
    } else {
      throw new Error(
        "Credentials is a path, but the file does not exist: " + credentialsPath
      );
    }
  } else {
    throw new Error("Credentials must be an object or a path to a file.");
  }
}
