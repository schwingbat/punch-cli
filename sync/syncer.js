const fs = require('fs')
const path = require('path')
const SyncService = require('./syncservice')

class Syncer {
  constructor (config, Punch) {
    if (!config) {
      throw new Error('Syncer requires a config object as the first parameter')
    }
    if (!Punch) {
      throw new Error('Syncer requires the Punch class to be passed as the second parameter')
    }

    this._config = config
    this._punch = Punch
  }

  _loadService (service) {
    if (service instanceof SyncService) {
      return service
    }

    if (typeof service !== 'string') {
      throw new Error('_loadService requires either a string or instance of SyncService')
    }

    const conf = this._config.sync.services
      .find(s => s.name.toLowerCase() === service.toLowerCase())

    if (conf) {
      const modulePath = path.join(__dirname, 'services', service.toLowerCase() + '.service.js')
      if (fs.existsSync(modulePath)) {
        const Service = require(modulePath)
        return new Service(conf, this._punch)
      } else {
        throw new Error(`Service ${service} is not (yet) supported.`)
      }
    } else {
      throw new Error(`Service ${service} is not configured in config.sync.services`)
    }
  }

  async _diff (manifest) {
    const punches = await this._punch.all()

    const uploads = punches.filter(punch => {
      // Upload if punch doesn't exist remotely or if local copy is newer.
      return !manifest[punch.id] || manifest[punch.id] < punch.updated
    })

    const downloads = []
    for (const id in manifest) {
      // Download if punch doesn't exist locally or if remote copy is newer.
      const punch = punches.find(p => p.id === id)
      if (!punch || punch.updated < manifest[id]) {
        downloads.push(id)
      }
    }

    return { uploads, downloads }
  }

  async sync (service) {
    /*
      Multi-sync
      - Get all manifests
      - Compare manifests and local against each other
      - Build upload/download lists for each service
      - Order requests so newest punches are fetched first

      For now it's just single sync
    */

    if (typeof service === 'object' || typeof service === 'string') {
      service = this._loadService(service)

      const manifest = await service.getManifest()
      const result = await this._diff(manifest)

      const { uploads, downloads } = result
      console.log(manifest, uploads.length, downloads.length)

      // const uploaded = []
      // const downloaded = []

      const uploaded = await service.upload(uploads, manifest)
      const downloaded = await service.download(downloads)

      downloaded.forEach(punch => {
        punch.save()
      })

      return { uploaded, downloaded }
    } else {
      throw new Error('First parameter must be a string or an instance of SyncService')
    }
  }
}

module.exports = Syncer
