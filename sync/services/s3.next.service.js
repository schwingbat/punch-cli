const fs = require('fs')
const path = require('path')
const SyncService = require('../syncservice.js')

class S3SyncService extends SyncService {
  constructor (config, Punch, S3 = require('aws-sdk').S3) {
    super(config)
    this._punch = Punch
    this._s3 = new S3(new S3Credentials(config.credentials))
  }

  getManifest () {
    const s3 = this._s3
    const config = this._config

    return new Promise((resolve, reject) => {
      const params = {
        Bucket: config.bucket,
        Key: 'punchmanifest.json'
      }

      s3.getObject(params, (err, obj) => {
        if (err) return reject(new Error('Error while downloading punch data: ' + err.message))

        console.log(obj)

        return resolve({})

        done()
      })
    })
  }

  upload (uploads = []) {
    const s3 = this._s3
    const config = this._config

    return new Promise((resolve, reject) => {
      if (uploads.length === 0) {
        return resolve([])
      }

      let uploaded = 0
      const done = () => {
        uploaded += 1
        if (uploaded === uploads.length) {
          return resolve(uploads)
        }
      }

      uploads.forEach(punch => {
        const params = {
          Bucket: config.bucket,
          Key: `punches/${punch.id}.json`,
          Body: JSON.stringify(punch.toJSON())
        }

        s3.putObject(params, (err, data) => {
          if (err) return reject(new Error('Error while uploading punch data: ' + err.message))
          done()
        })
      })
    })
  }

  download (ids = []) {
    const config = this._config
    const s3 = this._s3
    const Punch = this._punch

    return new Promise((resolve, reject) => {
      if (ids.length === 0) {
        return resolve([])
      }

      const downloaded = []
      const done = () => {
        if (downloaded.length === ids.length) {
          return resolve(downloaded)
        }
      }

      ids.forEach(id => {
        const params = {
          Bucket: config.bucket,
          Key: `punches/${id}.json`
        }

        s3.getObject(params, (err, obj) => {
          if (err) return reject(new Error('Error while downloading punch data: ' + err.message))

          console.log(obj)

          const body = JSON.parse(obj.Body.toString())

          downloaded.push(new Punch(body))
          done()
        })
      })
    })
  }
}

class S3Credentials {
  constructor (credentials) {
    if (!credentials) {
      throw new Error('S3 config has no credentials')
    }

    if (typeof credentials === 'string') {
      let credPath = path.resolve(credentials.replace(/^~/, require('os').homedir()))

      if (fs.existsSync(credPath)) {
        try {
          credentials = JSON.parse(fs.readFileSync(credPath))
        } catch (err) {
          throw new Error('There was a problem reading the S3 credentials file: ' + err)
        }
      } else {
        throw new Error('Credentials is a path, but the file does not exist: ' + credPath)
      }
    } else if (typeof credentials !== 'object') {
      throw new Error('Credentials should either be a path to a JSON file containing your S3 credentials or an object containing the credentials themselves.')
    }

    if (!credentials.hasOwnProperty('accessKeyId') || !credentials.hasOwnProperty('secretAccessKey')) {
      throw new Error('Credentials must include both accessKeyId and secretAccessKey.')
    }

    this.accessKeyId = credentials.accessKeyId
    this.secretAccessKey = credentials.secretAccessKey
  }
}

module.exports = S3SyncService
