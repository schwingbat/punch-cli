module.exports = function() {
  const path = require("path");
  const fs = require("fs");
  const MON = require("@schwingbat/mon");
  const SyncService = require("../syncservice.js");
  const resolvePath = require("../../utils/resolve-path.js");
  const B2 = require("backblaze-b2");

  return class B2SyncService extends SyncService {
    constructor(appConfig, serviceConfig, Punch) {
      super(serviceConfig);

      const creds = B2Credentials(serviceConfig.credentials, appConfig);

      this._config = serviceConfig;
      this._b2 = new B2(creds);
    }

    async getManifest() {
      const b2 = this._b2;
      const config = this._config;

      await b2.authorize();

      try {
        const response = await b2.downloadFileByName({
          bucketName: config.bucket,
          fileName: "punchmanifest.json",
          responseType: "json"
        });

        return {};
        // return response
      } catch (err) {
        console.log(err);
        if (err.response.status === 404) {
          return {};
        } else {
          throw err;
        }
      }
    }

    async upload(uploads = [], manifest = {}) {
      if (uploads.length === 0) {
        return [];
      }

      const b2 = this._b2;
      const config = this._config;
      let uploaded;

      const newManifest = { ...manifest };
      uploads.forEach(punch => {
        newManifest[punch.id] = punch.updated;
      });

      try {
        uploaded = await Promise.all(
          uploads.map(async punch => {
            const uploadUrl = await b2.getUploadUrl(config.bucketID);
            const opts = {
              uploadUrl: uploadUrl.data.uploadUrl,
              uploadAuthToken: uploadUrl.data.authorizationToken,
              filename: `punches/${punch.id}.json`,
              data: Buffer.from(JSON.stringify(punch.toJSON()))
            };

            return b2.uploadFile(opts);
          })
        );

        // Upload the new manifest
        await (async function() {
          const uploadUrl = await b2.getUploadUrl(config.bucket);
          const opts = {
            uploadUrl: uploadUrl.data.uploadUrl,
            uploadAuthToken: uploadUrl.data.authorizationToken,
            filename: "punchmanifest.json",
            data: Buffer.from(JSON.stringify(newManifest))
          };

          return b2.uploadFile(opts);
        })();
      } catch (err) {
        // console.error(err)
        throw err;
      }

      return uploads;
    }

    async download(ids = []) {
      console.log("downloads", ids);

      return [];
    }

    getSyncingMessage() {
      let label = this._config.label || `Backblaze B2 (${this._config.bucket})`;
      return `Syncing with ${label}`;
    }

    getSyncCompleteMessage() {
      let label = this._config.label || `Backblaze B2 (${this._config.bucket})`;
      return `Synced with ${label}`;
    }
  };

  function B2Credentials(credentials, appConfig) {
    // Read from path if needed.
    if (typeof credentials === "string") {
      let file;

      try {
        file = fs.readFileSync(
          resolvePath(credentials, path.dirname(appConfig.configPath)),
          "utf8"
        );
      } catch (err) {
        throw err;
      }

      const ext = path.extname(credentials).toLowerCase();

      switch (ext) {
        case ".mon":
          credentials = MON.parse(file);
          break;
        case ".json":
          credentials = JSON.parse(file);
          break;
        default:
          throw new Error(
            `${ext} files are not supported for credentials. Use .mon or .json`
          );
      }
    }

    // Check if properties are there
    if (!credentials.accountId || !credentials.applicationKey) {
      throw new Error(
        "B2 credentials must have both accountId and applicationKey properties"
      );
    }

    return credentials;
  }
};
