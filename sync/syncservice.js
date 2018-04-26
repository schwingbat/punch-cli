class SyncService {
  constructor (config) {
    if (!config) {
      throw new Error('Sync services require a config object as the first parameter')
    }
    this._config = config
  }
}

module.exports = SyncService
