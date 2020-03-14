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
    },

    async delete(ids = []) {
      events.emit("delete:start", { total: ids.length });

      events.emit("delete:end", { total: ids.length });

      return ids;
    }
  };
};
