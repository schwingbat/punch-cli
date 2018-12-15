const path = require('path')
const chalk = require('chalk')
const is = require('@schwingbat/is')

const services = {
  dummy: require('./services/dummy.service'),
  s3: require('./services/s3.service'),
  b2: require('./services/b2.service'),
  spaces: require('./services/spaces.service')
}

function Syncer (config, Punch) {
  if (!config) {
    throw new Error('Syncer requires a config object as the first parameter')
  }
  if (!Punch) {
    throw new Error('Syncer requires the Punch constructor to be passed as the second parameter')
  }

  function loadService (serviceName) {
    let serviceConf
    let name

    if (is.object(serviceName)) {
      serviceConf = serviceName
      name = serviceConf.name.toLowerCase()
    } else {
      name = serviceName.toLowerCase()
      serviceConf = config.sync.services
        .find(s => s.name.toLowerCase() === name)
    }

    if (!serviceConf) {
      throw new Error(`Service ${name} is not configured in config.sync.services`)
    }
    if (!services[name]) {
      throw new Error(`Service ${name} is not supported (yet?).`)
    }

    return new (services[name])(config, serviceConf, Punch)
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

  async function sync (service, check = false) {
    /*
      Multi-sync
      - Get all manifests
      - Compare manifests and local against each other
      - Build upload/download lists for each service
      - Order requests so newest punches are fetched first

      For now it's just single sync
    */

   if (is.not.object(service) || is.not.func(service.getManifest)) {
     throw new Error('sync() takes an instance of a sync service as a parameter.\nUse loadService to obtain one.')
   }

    try {
      const manifest = await service.getManifest()
      const result = await diff(manifest)

      const { uploads, downloads } = result
      let uploaded
      let downloaded

      if (check) {
        // If 'check' is true, only check for differences and don't actually upload anything
        uploaded = uploads
        downloaded = downloads
      } else {
        uploaded = await service.upload(uploads, manifest)
        downloaded = await service.download(downloads)

        for (let i = 0; i < downloaded.length; i++) {
          await downloaded[i].save()
        }
      }

      return { uploaded, downloaded }

    } catch (err) {
      const label = service._config.label || service._config.name
      const message = `[${label}] Sync Error: ${err.message}`
      throw new Error(message)
    }
  }

  async function syncAll ({ silent, services, check, auto } = {}) {
    const loader = require('../utils/loader')()
    const { symbols } = config

    const syncIt = async (service) => {
      const start = Date.now()

      if (!silent) {
        loader.start(service.getSyncingMessage())
      }

      try {
        const results = await sync(service)
      
        if (!silent) {
          const elapsed = (Date.now() - start) / 1000
          const up = `${chalk.grey('[')}${chalk.magenta(symbols.syncUpload)} ${results.uploaded.length}${chalk.grey(']')}`
          const down = `${chalk.grey('[')}${chalk.cyan(symbols.syncDownload)} ${results.downloaded.length}${chalk.grey(']')}`
          let message

          if (check) {
            let label = service._config.label || service._config.name
            message = `${chalk.bold('Checked')} ${label}`
          } else {
            message = service.getSyncCompleteMessage()
          }

          loader.stop(`${chalk.green(symbols.syncSuccess)} ${up}${down} ${message} (${elapsed.toFixed(2)}s)`)
        }
      } catch (err) {
        if (!silent) {
          loader.stop(chalk.red(symbols.error) + ' ' + err.message)
          // console.log()
        } else {
          console.log(chalk.red(symbols.error) + ' ' + err.message)
        }
      }
    }

    if (services) {
      services = services.map(s => {
        const key = s.toLowerCase()
        const service = config.sync.services.find(service => {
          return (service.name.toLowerCase() === key || service.label.toLowerCase() === key)
        })

        if (service) {
          try {
            return loadService(service)
          } catch (err) {
            const label = service.label || service.name
            console.log(chalk.yellow(symbols.warning) + ` [${label}] Sync Warning: ${err.message}`)
          }
        } else {
          console.log(chalk.yellow(symbols.warning) + ` Service "${s}" is not in your config file`)
        }
      }).filter(s => s != null)
    } else {
      services = config.sync.services.map((service, i) => {
        try {
          return loadService(service)
        } catch (err) {
          const label = service.label || service.name
          console.log(chalk.yellow(symbols.warning) + ` [${label}] Sync Warning: ${err.message}`)
        }
      }).filter(s => s != null && (!auto || s._config.auto))
      // Filter services if 'auto' prop is off during autosync
    }

    for (let i = 0; i < services.length; i++) {
      await syncIt(services[i])
      console.log()
    }

    return Promise.resolve()
    // return Promise.all(services.map(async s => await syncIt(s)))
  }

  return {
    sync,
    syncAll,
    diff,
    loadService,
  }

}

module.exports = Syncer
