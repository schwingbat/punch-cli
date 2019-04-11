const fs = require("fs");
const path = require("path");
const resolvePath = require("../../utils/resolve-path");
const SyncService = require("../syncservice.js");
const MON = require("@schwingbat/mon");

class S3SyncService extends SyncService {
  constructor(appConfig, serviceConfig, Punch, S3 = require("aws-sdk").S3) {
    let creds;

    if (!serviceConfig.credentials) {
      throw new Error(
        "S3 sync configuration does not specify any `credentials` field. This can be either a path to a file or an object."
      );
    }

    const creds = this.loadCredentialsFrom(serviceConfig, appConfig.configPath);
    if (!creds.accessKeyId || !creds.secretAccessKey) {
      throw new Error(
        "S3 credentials object must include both 'accessKeyId' and 'secretAccessKey' fields"
      );
    }

    creds.region = serviceConfig.region || "us-west-2";
    creds.endpoint = serviceConfig.endpoint || "s3.amazonaws.com";

    serviceConfig.auto = serviceConfig.auto == null ? true : serviceConfig.auto;

    super(serviceConfig);

    this._punch = Punch;
    this._s3 = new S3(creds);
  }

  getManifest() {
    const s3 = this._s3;
    const config = this._config;

    return new Promise((resolve, reject) => {
      const params = {
        Bucket: config.bucket,
        Key: "punchmanifest.json"
      };

      s3.getObject(params, (err, obj) => {
        if (err) {
          if (err.code === "NoSuchKey") {
            // If manifest doesn't exist, return a blank manifest.
            // There are likely no files in the bucket.
            return resolve({});
          } else {
            return reject(err);
          }
        }

        const manifest = JSON.parse(obj.Body.toString());
        for (const id in manifest) {
          manifest[id] = new Date(manifest[id]);
        }

        return resolve(manifest);
      });
    });
  }

  async upload(uploads = [], manifest = {}) {
    const s3 = this._s3;
    const config = this._config;

    return new Promise((resolve, reject) => {
      if (uploads.length === 0) {
        return resolve([]);
      }

      let uploaded = 0;
      const done = () => {
        uploaded += 1;
        if (uploaded === uploads.length) {
          const newManifest = { ...manifest };
          uploads.forEach(punch => {
            newManifest[punch.id] = punch.updated;
          });
          const params = {
            Bucket: config.bucket,
            Key: "punchmanifest.json",
            Body: JSON.stringify(newManifest, null, 2)
          };
          s3.putObject(params, (err, data) => {
            if (err)
              return reject(
                new Error(
                  "Error uploading new punchmanifest.json: " + err.message
                )
              );
            return resolve(uploads);
          });
        }
      };

      uploads.forEach(punch => {
        const params = {
          Bucket: config.bucket,
          Key: `punches/${punch.id}.json`,
          Body: JSON.stringify(punch.toJSON(true))
        };

        s3.putObject(params, (err, data) => {
          if (err)
            return reject(
              new Error("Error while uploading punch data: " + err.message)
            );
          done();
        });
      });
    });
  }

  download(ids = []) {
    const config = this._config;
    const s3 = this._s3;
    const Punch = this._punch;

    return new Promise((resolve, reject) => {
      if (ids.length === 0) {
        return resolve([]);
      }

      const downloaded = [];
      const done = () => {
        if (downloaded.length === ids.length) {
          return resolve(downloaded);
        }
      };

      ids.forEach(id => {
        const params = {
          Bucket: config.bucket,
          Key: `punches/${id}.json`
        };

        s3.getObject(params, (err, obj) => {
          if (err)
            return reject(
              new Error("Error while downloading punch data: " + err.message)
            );

          const body = JSON.parse(obj.Body.toString());

          downloaded.push(new Punch(body));
          done();
        });
      });
    });
  }

  getSyncingMessage() {
    let label = this._config.label || `S3 (${this._config.bucket})`;
    return `Syncing with ${label}`;
  }

  getSyncCompleteMessage() {
    let label = this._config.label || `S3 (${this._config.bucket})`;
    return `Synced with ${label}`;
  }
}

module.exports = S3SyncService;
