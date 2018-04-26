const path = require('path')
const Service = require('./s3.service.js')

const credsPath = path.join(__dirname, '../../test/s3creds.json')
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
    updated: 1523986200000
  }
}]

let S3Calls = {}

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
    return callback(null, {
      Contents: mockBucketContents.map(c => {
        return {
          Key: c.Key,
          LastModified: c.LastModified
        }
      })
    })
  }

  putObject (props = {}, callback) {
    this._recordCall('putObject', { props })
    return callback(null, null)
  }

  getObject (props = {}, callback) {
    this._recordCall('getObject', { props })
    return callback(null, mockBucketContents.map(c => {
      return {
        Body: c.Body
      }
    }))
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
  })

  describe('getManifest', () => {
    it('calls S3 listObjectsV2', () => {
      expect.assertions(1)

      expect(service.getManifest()).resolves.toEqual({
        'aae7e002-39cf-4490-9adf-8cf529823f01': 1523986200000
      })
    })
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
          Key: 'asdf.json',
          Body: { id: 'asdf', project: 'test' }
        })
      })
    })
  })

  describe('download', () => {
    it('immediately resolves if there is nothing to download', () => {
      expect.assertions(2)

      service.download([]).then(uploaded => {
        expect(S3Calls.getObject).toBeFalsy()
      })

      service.download().then(uploaded => {
        expect(S3Calls.getObject).toBeFalsy()
      })
    })
  })
})
