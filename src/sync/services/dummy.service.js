const SyncService = require('../syncservice.js')

class DummySyncService extends SyncService {
  getManifest () {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({})
      }, Math.random() * 300 + 200)
    })
  }

  upload (uploads) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(uploads.map(p => p))
      }, Math.random() * 300 + 200)
    })
  }

  download (downloads) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([{}, {}, {}])
      }, Math.random() * 300 + 200)
    })
  }

  getSyncingMessage () {
    return 'Syncing with dummy service...'
  }
}

module.exports = DummySyncService
