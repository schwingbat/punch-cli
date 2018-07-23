// Digital Ocean Spaces sync service. Spaces is S3 compatible,
// so we'll use the S3 service behind the scenes. We just need
// to tweak the configuration first.

const S3SyncService = require('./s3.service.js')

module.exports = class SpacesSyncService extends S3SyncService {
  constructor (appConfig, serviceConfig, Punch) {
    const conf = {}

    if (!serviceConfig.region && !serviceConfig.endpoint) {
      throw new Error('region or endpoint is required for Spaces sync config')
    }
  
    if (!serviceConfig.bucket && !serviceConfig.space) {
      throw new Error('space or bucket is required for Spaces sync config')
    }

    conf.credentials = serviceConfig.credentials
    conf.bucket = serviceConfig.bucket || serviceConfig.space
    conf.name = serviceConfig.name
    conf.label = serviceConfig.label
    conf.auto = serviceConfig.auto == null
      ? true 
      : serviceConfig.auto
    
    if (serviceConfig.region) {
      conf.endpoint = `${serviceConfig.region}.digitaloceanspaces.com`
      conf.region = serviceConfig.region
    } else if (serviceConfig.endpoint) {
      conf.endpoint = serviceConfig.endpoint
      conf.region = serviceConfig.endpoint.match(/^([a-zA-Z0-9]+).digitaloceanspaces.com/)
    }
  
    super(appConfig, conf, Punch)
  }

  getSyncingMessage () {
    let label = this._config.label || `Spaces (${this._config.bucket})`
    return `Syncing with ${label}`
  }

  getSyncCompleteMessage () {
    let label = this._config.label || `Spaces (${this._config.bucket})`
    return `Synced with ${label}`
  }
}