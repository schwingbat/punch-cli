const SyncService = require('../syncservice.js')

class DummySyncService extends SyncService {
  async getManifest () {
    return {}
  }

  async upload (uploads) {
    return uploads.map(p => p)
  }

  async download (downloads) {
    return []
  }
}

module.exports = DummySyncService