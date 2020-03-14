const EventEmitter = require("events");
const nodeFetch = require("node-fetch");
const fetchDefaults = require("fetch-defaults");

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
      await fetch("/api/v1/sync/upload", {
        method: "POST",
        body: JSON.stringify({
          punches: uploads.map(p => p.toJSON())
        })
      });

      return uploads;
    },

    async download(ids) {
      const res = await fetch("/api/v1/sync/download", {
        method: "POST",
        body: JSON.stringify({ ids })
      });

      const body = await res.json();

      return body.data.punches.map(p => new Punch(p));
    },

    async delete(ids) {
      await fetch("/sync/delete", {
        method: "POST",
        body: JSON.stringify({ ids })
      });

      return ids;
    }
  };
};
