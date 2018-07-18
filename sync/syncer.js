const path = require('path')
const chalk = require('chalk')

const nameMap = {
  'dummy':      'dummy.service.js',
  's3':         's3.service.js',
  // 'b2':         'b2.service.js',
  'spaces':     'spaces.service.js',
}

function Syncer (config, Punch) {
  if (!config) {
    throw new Error('Syncer requires a config object as the first parameter')
  }
  if (!Punch) {
    throw new Error('Syncer requires the Punch constructor to be passed as the second parameter')
  }

  function loadService (serviceName) {
    let name = serviceName.toLowerCase()
    const serviceConf = config.sync.services
      .find(s => s.name.toLowerCase() === name)

    if (!serviceConf) {
      throw new Error(`Service ${serviceName} is not configured in config.sync.services`)
    }
    if (!nameMap[name]) {
      throw new Error(`Service ${serviceName} is not supported (yet?).`)
    }

    const modulePath = path.join(__dirname, 'services', nameMap[name])
    return new (require(modulePath))(serviceConf, Punch)
  }

  async function diff (manifest) {
    const punches = await Punch.all()

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

  async function sync (service) {
    /*
      Multi-sync
      - Get all manifests
      - Compare manifests and local against each other
      - Build upload/download lists for each service
      - Order requests so newest punches are fetched first

      For now it's just single sync
    */

   if (typeof service !== 'object' || typeof service.getManifest !== 'function') {
     throw new Error('sync() takes an instance of a sync service as a parameter.\nUse loadService to obtain one.')
   }

   try {
      const manifest = await service.getManifest()
      const result = await diff(manifest)

      const { uploads, downloads } = result

      const uploaded = await service.upload(uploads, manifest)
      const downloaded = await service.download(downloads)

      for (let i = 0; i < downloaded.length; i++) {
        await downloaded[i].save()
      }

      return { uploaded, downloaded }

    } catch (err) {
      const label = service._config.label || service._config.name
      const message = `[${label}] Sync Error: ${err.message}`
      throw new Error(message)
    }
  }

  async function syncAll ({ silent } = {}) {
    const loader = require('../utils/loader')()
    const { symbols } = config

    const syncIt = async (service) => {
      if (!silent) {
        loader.start(service.getSyncingMessage())
      }
      try {
        const results = await sync(service)
      
        if (!silent) {
          let report = chalk.green(symbols.syncSuccess) + ' ' + service.getSyncCompleteMessage() + ' '
          if (results.uploaded.length > 0) {
            report += `${chalk.grey('[')}${chalk.magenta(symbols.syncUpload)} ${results.uploaded.length}${chalk.grey(']')}`

            if (results.downloaded.length > 0) {
              report += ' '
            }
          }
          if (results.downloaded.length > 0) {
            report += `${chalk.grey('[')}${chalk.cyan(symbols.syncDownload)} ${results.downloaded.length}${chalk.grey(']')}`
          }
          loader.stop(report)
        }
      } catch (err) {
        if (!silent) {
          loader.stop(chalk.red(symbols.error) + ' ' + err.message)
        } else {
          console.log(chalk.red(symbols.error) + ' ' + err.message)
        }
      }
    }

    const services = config.sync.services.map((service, i) => {
      try {
        return loadService(service.name)
      } catch (err) {
        const label = service.label || service.name
        console.log(chalk.yellow(symbols.warning) + ` [${label}] Sync Warning: ${err.message}`)
      }
    }).filter(s => s != null)

    return Promise.all(services.map(s => syncIt(s)))
  }

  return {
    sync,
    syncAll,
    diff,
    loadService,
  }

}

module.exports = Syncer
