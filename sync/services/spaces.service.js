// Digital Ocean Spaces sync service. Spaces is S3 compatible,
// so we'll use the S3 service behind the scenes.

const S3SyncService = require('./s3.service.js')

module.exports = class SpacesSyncService extends S3SyncService {
  constructor (config, Punch) {
    const conf = {}

    if (!config.region && !config.endpoint) {
      throw new Error('region or endpoint is required for Spaces sync config')
    }
  
    if (!config.bucket && !config.space) {
      throw new Error('space or bucket is required for Spaces sync config')
    }

    conf.credentials = config.credentials
    conf.bucket = config.bucket || config.space
    
    if (config.region) {
      conf.endpoint = `${config.region}.digitaloceanspaces.com`
    } else if (config.endpoint) {
      conf.endpoint = config.endpoint
    }
  
    super(conf, Punch)
  }

  getSyncingMessage () {
    return `Syncing with Spaces (${this._config.bucket})`
  }

  getSyncCompleteMessage () {
    return `Synced with Spaces (${this._config.bucket})`
  }
}