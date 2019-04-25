const fs = require("fs");
const path = require("path");
const resolvePath = require("../utils/resolve-path");
const MON = require("@schwingbat/mon");

class SyncService {
  constructor(config) {
    if (!config) {
      throw new Error(
        "Sync services require a config object as the first parameter"
      );
    }
    this._config = config;
  }

  loadCredentialsFrom(credentials, configPath) {
    if (typeof credentials === "string") {
      if (path.isAbsolute(credentials)) {
        return credentialsFromAbsolutePath(credentials);
      } else {
        return credentialsFromRelativePath(
          credentials,
          path.dirname(configPath)
        );
      }
    } else if (typeof credentials === "object" && !Array.isArray(credentials)) {
      return credentials;
    } else {
      throw new Error("Credentials must be an object or a path to a file.");
    }
  }

  async getManifest() {
    return {};
  }

  async upload(uploads = [], manifest = {}) {
    return uploads;
  }

  async download(ids = []) {
    const downloaded = [];
    return downloaded;
  }

  getSyncingMessage() {
    let label = this._config.label;
    return `Syncing with ${label}`;
  }

  getSyncCompleteMessage() {
    let label = this._config.label;
    return `Synced with ${label}`;
  }
}

/*==========================*\
||    Credential Loaders    ||
\*==========================*/

function credentialsFromAbsolutePath(p) {
  if (fs.existsSync(p)) {
    const ext = path.extname(p).toLowerCase();
    const read = fs.readFileSync(p, "utf8");

    let parsed;

    try {
      switch (ext) {
        case ".yaml":
          parsed = require("js-yaml").safeLoad(read);
          break;
        case ".json":
          parsed = JSON.parse(read);
          break;
        case ".mon":
          parsed = MON.parse(read);
          break;
        default:
          throw new Error(
            `${ext} files are not supported as credential sources - must be .json or .mon`
          );
      }
    } catch (err) {
      throw new Error(
        "There was a problem reading the credentials file: " + err
      );
    }

    return parsed;
  } else {
    throw new Error("Credentials is a path, but the file does not exist: " + p);
  }
}

function credentialsFromRelativePath(p, root) {
  return credentialsFromAbsolutePath(resolvePath(p, root));
}

module.exports = SyncService;
