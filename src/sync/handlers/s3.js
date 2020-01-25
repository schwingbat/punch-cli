const util = require("util");
const EventEmitter = require("events");

module.exports = function(config, Punch, S3 = require("aws-sdk").S3) {
  const { credentials } = config;

  if (
    !credentials ||
    !credentials.accessKeyId ||
    !credentials.secretAccessKey
  ) {
    throw new Error(
      "S3 credentials object must include both 'accessKeyId' and 'secretAccessKey' fields"
    );
  }

  const s3 = new S3({
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
    region: config.region || "us-west-2",
    endpoint: config.endpoint || "s3.amazonaws.com"
  });

  const getObject = util.promisify(s3.getObject.bind(s3));
  const putObject = util.promisify(s3.putObject.bind(s3));

  const events = new EventEmitter();

  return {
    events,
    config,

    /**
     * Retrieves punch IDs and the dates each were last updated in the S3 bucket.
     */
    async getManifest() {
      const res = await getObject({
        Bucket: config.bucket,
        Key: "punchmanifest.json"
      });

      const manifest = {};
      const body = JSON.parse(res.Body.toString());

      for (const id in body) {
        manifest[id] = new Date(body[id]);
      }

      return manifest;
    },

    /**
     * Uploads an array of punches to the S3 bucket and writes an updated manifest.
     *
     * @param {object} uploads - Array of punches to upload.
     * @param {object} manifest - Existing bucket manifest.
     */
    async upload(uploads = [], manifest = {}) {
      events.emit("upload:start", { total: uploads.length });

      if (uploads.length === 0) {
        events.emit("upload:end", { total: uploads.length });
        return [];
      }

      let progress = 0;

      await Promise.all(
        uploads.map(async punch => {
          await putObject({
            Bucket: config.bucket,
            Key: `punches/${punch.id}.json`,
            Body: JSON.stringify(punch.toJSON())
          });

          progress++;

          events.emit("upload:progress", {
            progress,
            total: uploads.length
          });
        })
      );

      const newManifest = { ...manifest };

      uploads.forEach(punch => {
        newManifest[punch.id] = punch.updated;
      });

      await putObject({
        Bucket: config.bucket,
        Key: "punchmanifest.json",
        Body: JSON.stringify(newManifest)
      });

      events.emit("upload:end", { total: uploads.length });

      return uploads;
    },

    /**
     * Downloads remote punches using an array of IDs.
     *
     * @param {string[]} ids - An array of punch IDs to download.
     */
    async download(ids = []) {
      events.emit("download:start", { total: ids.length });

      if (ids.length === 0) {
        events.emit("download:end", { total: ids.length });
        return [];
      }

      let downloaded = [];
      let progress = 0;

      await Promise.all(
        ids.map(async id => {
          const res = await getObject({
            Bucket: config.bucket,
            Key: `punches/${id}.json`
          });

          const body = JSON.parse(res.Body.toString());

          progress++;

          events.emit("download:progress", {
            progress,
            total: ids.length
          });

          downloaded.push(new Punch(body));
        })
      );

      events.emit("download:end", { total: ids.length });

      return downloaded;
    }
  };
};

// module.exports = function() {
//   const SyncService = require("../syncservice.js");

//   return class S3SyncService {
//     constructor(config, Punch, S3 = require("aws-sdk").S3) {
//       if (
//         !config.credentials ||
//         !config.credentials.accessKeyId ||
//         !config.credentials.secretAccessKey
//       ) {
//         throw new Error(
//           "S3 credentials object must include both 'accessKeyId' and 'secretAccessKey' fields"
//         );
//       }

//       creds.region = config.region || "us-west-2";
//       creds.endpoint = config.endpoint || "s3.amazonaws.com";

//       // Using ternary form to prevent overriding when the `auto` setting is set to false.
//       config.auto = config.auto == null ? true : config.auto;

//       this.config = config;
//       this.Punch = Punch;
//       this.s3 = new S3(creds);
//     }

//     getManifest() {
//       const { s3, config } = this;

//       return new Promise((resolve, reject) => {
//         const params = {
//           Bucket: config.bucket,
//           Key: "punchmanifest.json"
//         };

//         s3.getObject(params, (err, obj) => {
//           if (err) {
//             if (err.code === "NoSuchKey") {
//               // If manifest doesn't exist, return a blank manifest.
//               // There are likely no files in the bucket.
//               return resolve({});
//             } else {
//               return reject(err);
//             }
//           }

//           const manifest = JSON.parse(obj.Body.toString());
//           for (const id in manifest) {
//             manifest[id] = new Date(manifest[id]);
//           }

//           return resolve(manifest);
//         });
//       });
//     }

//     async upload(uploads = [], manifest = {}) {
//       const { s3, config } = this;

//       return new Promise((resolve, reject) => {
//         if (uploads.length === 0) {
//           return resolve([]);
//         }

//         let uploaded = 0;
//         const done = () => {
//           uploaded += 1;
//           if (uploaded === uploads.length) {
//             const newManifest = { ...manifest };
//             uploads.forEach(punch => {
//               newManifest[punch.id] = punch.updated;
//             });
//             const params = {
//               Bucket: config.bucket,
//               Key: "punchmanifest.json",
//               Body: JSON.stringify(newManifest, null, 2)
//             };
//             s3.putObject(params, (err, data) => {
//               if (err)
//                 return reject(
//                   new Error(
//                     "Error uploading new punchmanifest.json: " + err.message
//                   )
//                 );
//               return resolve(uploads);
//             });
//           }
//         };

//         uploads.forEach(punch => {
//           const params = {
//             Bucket: config.bucket,
//             Key: `punches/${punch.id}.json`,
//             Body: JSON.stringify(punch.toJSON(true))
//           };

//           s3.putObject(params, (err, data) => {
//             if (err)
//               return reject(
//                 new Error("Error while uploading punch data: " + err.message)
//               );
//             done();
//           });
//         });
//       });
//     }

//     download(ids = []) {
//       const { config, s3, Punch } = this;

//       return new Promise((resolve, reject) => {
//         if (ids.length === 0) {
//           return resolve([]);
//         }

//         const downloaded = [];
//         const done = () => {
//           if (downloaded.length === ids.length) {
//             return resolve(downloaded);
//           }
//         };

//         ids.forEach(id => {
//           const params = {
//             Bucket: config.bucket,
//             Key: `punches/${id}.json`
//           };

//           s3.getObject(params, (err, obj) => {
//             if (err)
//               return reject(
//                 new Error("Error while downloading punch data: " + err.message)
//               );

//             const body = JSON.parse(obj.Body.toString());

//             downloaded.push(new Punch(body));
//             done();
//           });
//         });
//       });
//     }

//     getSyncingMessage() {
//       let label = this._config.label || `S3 (${this._config.bucket})`;
//       return `Syncing with ${label}`;
//     }

//     getSyncCompleteMessage() {
//       let label = this._config.label || `S3 (${this._config.bucket})`;
//       return `Synced with ${label}`;
//     }
//   };
// };
