const path = require('path')
const Service = require('./s3.service.js')

const credsPath = path.join(__dirname, '../../test/s3creds.json')
console.log(credsPath)
const config = {
  name: 'S3',
  credentials: {
    accessKeyId: 'asdf',
    secretAccessKey: 'asdf'
  }
}

const mockBucketContents = [{
  Key: 'aae7e002-39cf-4490-9adf-8cf529823f01.json',
  LastModified: '2018-04-17T17:30Z',
  Body: {
    id: 'aae7e002-39cf-4490-9adf-8cf529823f01.json',
    in: 1523984400000,
    out: 1523986200000,
    project: 'test',
    comments: [
      { comment: 'A comment', timestamp: 1523985300000 }
    ],
    created: 1523984400000,
    updated: 1523986200000,
    toString() {
      return JSON.stringify(this)
    }
  }
}]

let S3Calls = {}
let throwListError = false
let throwGetError = false
let throwPutError = false

class MockS3 {
  constructor (credentials) {
    this.credentials = credentials
  }

  _recordCall (func, data) {
    if (!S3Calls[func]) {
      S3Calls[func] = []
    }
    S3Calls[func].push(data)
  }

  listObjectsV2 (props = {}, callback) {
    this._recordCall('listObjectsV2', { props })
    if (throwListError) {
      return callback(new Error('Test error'))
    } else {
      return callback(null, {
        Contents: mockBucketContents.map(c => {
          return {
            Key: c.Key,
            LastModified: c.LastModified
          }
        })
      })
    }
  }

  putObject (props = {}, callback) {
    this._recordCall('putObject', { props })
    if (throwPutError) {
      return callback(new Error('Test error'))
    } else {
      return callback(null, null)
    }
  }

  getObject (props = {}, callback) {
    this._recordCall('getObject', { props })
    if (throwGetError) {
      return callback(new Error('Test error'))
    } else {
      return callback(null, mockBucketContents[0])
    }
  }
}

class MockPunch {
  constructor (props = {}) {
    this.id = props.id
    this.project = props.project
  }

  toJSON () {
    return {
      id: this.id,
      project: this.project
    }
  }
}

describe('S3SyncService', () => {
  let service

  beforeEach(() => {
    service = new Service(config, MockPunch, MockS3)
    S3Calls = {}

    throwListError = false
    throwGetError = false
    throwPutError = false
  })

  describe('constructor', () => {
    it('instantiates', () => {
      expect(service instanceof Service).toBe(true)
    })

    it('uses S3 credentials object from config', () => {
      expect(service._s3.credentials.accessKeyId).toEqual(config.credentials.accessKeyId)
      expect(service._s3.credentials.secretAccessKey).toEqual(config.credentials.secretAccessKey)
    })

    it('loads S3 credentials from a JSON file if credentials is a path', () => {
      service = new Service({
        name: 'S3',
        credentials: credsPath
      }, MockPunch, MockS3)

      expect(service._s3.credentials.accessKeyId).toBe('asdf')
      expect(service._s3.credentials.secretAccessKey).toBe('asdf')
    })

    it('throws an error if credentials are not included in config', () => {
      expect(() => {
        service = new Service({ name: 'S3' }, MockPunch, MockS3)
      }).toThrow(new Error('S3 config has no credentials'))
    })

    it('throws an error if credentials is missing a required property', () => {
      expect(() => {
        service = new Service({
          name: 'S3',
          credentials: { secretAccessKey: '123' }
        }, MockPunch, MockS3)
      }).toThrow(new Error('Credentials must include both accessKeyId and secretAccessKey.'))
    })

    it('throws an error if credentials are not a string or object', () => {
      expect(() => {
        service = new Service({
          name: 'S3',
          credentials: 12
        })
      }).toThrow(new Error('Credentials should either be a path to a JSON file containing your S3 credentials or an object containing the credentials themselves.'))
    })
  })

  describe('getManifest', () => {
    // it('calls S3 listObjectsV2', () => {
    //   expect.assertions(1)

    //   expect(service.getManifest()).resolves.toEqual({
    //     'aae7e002-39cf-4490-9adf-8cf529823f01': 1523986200000
    //   })
    // })
  })

  describe('upload', () => {
    it('immediately resolves if there is nothing to upload', () => {
      expect.assertions(2)

      service.upload([]).then(uploaded => {
        expect(S3Calls.putObject).toBeFalsy()
      })

      service.upload().then(uploaded => {
        expect(S3Calls.putObject).toBeFalsy()
      })
    })

    it('calls putObject', () => {
      expect.assertions(3)

      service.upload([ new MockPunch({ id: 'asdf', project: 'test' }) ]).then(uploaded => {
        expect(S3Calls.putObject).toBeTruthy()
        expect(S3Calls.putObject.length).toBe(1)
        expect(S3Calls.putObject[0].props).toEqual({
          Bucket: config.bucket,
          Key: 'punches/asdf.json',
          Body: { id: 'asdf', project: 'test' }
        })
      })
    })

    it('rejects the promise if putObject throws an error', () => {
      throwPutError = true
      expect(service.upload([ new MockPunch({ project: 'test' }), new MockPunch({ project: 'test2' }) ]))
        .rejects.toEqual(new Error('Error while uploading punch data: Test error'))
    })
  })

  describe('download', () => {
    it('immediately resolves if there is nothing to download', async () => {
      await service.download([])
      expect(S3Calls.getObject).toBeFalsy()

      await service.download()
      expect(S3Calls.getObject).toBeFalsy()
    })

    it('calls getObject for each ID', async () => {
      await service.download(['123', '456', '789'])
      expect(S3Calls.getObject).toBeTruthy()
      expect(S3Calls.getObject.length).toBe(3)
    })

    it('rejects the Promise if getObject throws an error', () => {
      throwGetError = true
      expect(service.download(['123']))
        .rejects.toEqual(new Error('Error while downloading punch data: Test error'))
    })
  })
})
