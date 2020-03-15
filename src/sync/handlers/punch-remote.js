const EventEmitter = require("events");
const nodeFetch = require("node-fetch");
const fetchDefaults = require("fetch-defaults");
const _ = require("lodash");

module.exports = function(config, Punch) {
  const { credentials, url } = config;

  if (!credentials || !credentials.token) {
    throw new Error(`No credentials provided for punch-remote`);
  }

  const fetch = fetchDefaults(nodeFetch, url, {
    headers: {
      Authorization: `Bearer ${credentials.token}`,
      "Content-Type": "application/json"
    }
  });

  const events = new EventEmitter();

  return {
    events,
    config,

    async getManifest() {
      const res = await fetch("/api/v1/sync/manifest", {
        method: "GET"
      });

      const body = await res.json();

      return body.data;
    },

    async upload(uploads) {
      const chunks = _.chunk(uploads, 100);

      for (const chunk of chunks) {
        await fetch("/api/v1/sync/upload", {
          method: "POST",
          body: JSON.stringify({
            punches: chunk.map(p => p.toJSON())
          })
        });
      }

      return uploads;
    },

    async download(ids) {
      const chunks = _.chunk(ids, 100);
      const punches = [];

      for (const chunk of chunks) {
        const res = await fetch("/api/v1/sync/download", {
          method: "POST",
          body: JSON.stringify({ ids: chunk })
        });

        const body = await res.json();
        const processed = body.data.punches.map(p => new Punch(p));

        punches.push(...processed);
      }

      return punches;
    },

    async delete(ids) {
      await fetch("/api/v1/sync/delete", {
        method: "POST",
        body: JSON.stringify({ ids })
      });

      return ids;
    }
  };
};
