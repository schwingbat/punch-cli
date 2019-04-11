const SyncService = require("../syncservice");
const fetch = require("node-fetch");

class PunchSyncService extends SyncService {
  constructor(punchConfig, svcConfig, Punch) {
    super(svcConfig);

    const creds = this.loadCredentialsFrom(
      svcConfig.credentials,
      punchConfig.configPath
    );
    if (!creds.email || !creds.accessToken) {
      throw new Error(
        "Punch credentials must include both 'email' and 'accessToken' fields."
      );
    }

    creds.host = svcConfig.host || "https://www.punch.sh";

    this.Punch = Punch;
    this.punchConfig = punchConfig;
    this.svcConfig = svcConfig;
    this.credentials = creds;
  }

  async getManifest() {
    const url = new URL("./api/v1/sync/manifest", this.credentials.host);
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders()
      });

      const json = await response.json();
      const parsed = {};

      for (const id in json) {
        parsed[id] = new Date(json[id]);
      }

      return parsed;
    } catch (err) {
      throw err;
    }
  }

  async upload(uploads = [], manifest = {}) {
    const url = new URL("/api/v1/sync/upload", this.credentials.host);
    try {
      await fetch(url, {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify({
          punches: uploads.map(p => ({
            id: p.id,
            project: p.project,
            in: p.in.toISOString(),
            out: p.out ? p.out.toISOString() : null,
            rate: p.rate,
            created: p.created.toISOString(),
            updated: p.updated.toISOString(),
            comments: p.comments.map(c => ({
              comment: c.comment,
              timestamp: c.timestamp.toISOString()
            }))
          }))
        })
      });

      return uploads;
    } catch (err) {
      throw err;
    }
  }

  async download(ids = []) {
    if (ids.length === 0) {
      return [];
    }

    const url = new URL("/api/v1/sync/download", this.credentials.host);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          ids
        })
      });

      const punches = await response.json();

      return punches.map(p => new this.Punch(p));
    } catch (err) {
      throw err;
    }
  }

  getHeaders() {
    const email = Buffer.from(this.credentials.email).toString("base64");
    const token = Buffer.from(this.credentials.accessToken).toString("base64");
    return {
      Authorization: `Bearer ${email}.${token}`,
      "Content-Type": "application/json"
    };
  }
}

module.exports = PunchSyncService;
