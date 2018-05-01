const path = require('path')
const Syncer = require('./syncer')
const DummyService = require('./services/dummy.service.js')
const SyncService = require('./syncservice.js')

const config = {
  punchPath: path.join(__dirname, '../test/testpunches'),
  sync: {
    autoSync: false,
    services: [{
      name: 'dummy'
    }, {
      name: 'nonexistent'
    }]
  }
}

let saved = []

class MockPunch {
  constructor (props = {}) {
    this.id = props.id
    this.project = props.project
    this.updated = props.updated
  }

  save () {
    saved.push(this)
  }
}

MockPunch.all = function () {
  return [
    new MockPunch({ id: 'one', project: 'test', updated: 12345 }),
    new MockPunch({ id: 'two', project: 'test2', updated: 12754 }),
    new MockPunch({ id: 'three', project: 'test3', updated: 35124 })
  ]
}

const manifest = {
  one: 12346,
  two: 4561,
  three: 40000
}

class MockService extends SyncService {
  async getManifest () {
    return manifest
  }

  async upload (punches) {
    return punches
  }

  async download (ids) {
    return MockPunch.all()
      .filter(p => manifest[p.id])
      .map(p => {
        p.updated = manifest[p.id]
        return p
      })
  }
}

beforeEach(() => {
  saved = []
})

describe('Syncer', () => {
  describe('constructor', () => {
    it('instantiates', () => {
      const syncer = new Syncer(config, MockPunch)
      expect(syncer instanceof Syncer).toBe(true)
    })

    it('uses Punch passed as second parameter', () => {
      const syncer = new Syncer(config, MockPunch)
      expect(syncer._punch).toBe(MockPunch)
    })

    it('throws an error if a config object is not passed as the first parameter', () => {
      expect(() => {
        const syncer = new Syncer()
      }).toThrow()
    })

    it('throws an error if a Punch constructor is not passed as the second parameter', () => {
      expect(() => {
        const syncer = new Syncer(config)
      }).toThrow()
    })
  })

  describe('_loadService', () => {
    let syncer

    beforeEach(() => {
      syncer = new Syncer(config, MockPunch)
    })

    it('loads a service module by name', () => {
      expect(syncer._loadService('dummy') instanceof DummyService).toBe(true)
    })

    it('throws an error if service is not configured in config file', () => {
      expect(() => syncer._loadService('asdf')).toThrow()
    })

    it('throws an error if service is configured but has no module', () => {
      expect(() => syncer._loadService('nonexistent')).toThrow()
    })

    it('throws an error if service is not a SyncService or a string', () => {
      expect(() => syncer._loadService(5)).toThrow()
    })
  })

  describe('_diff', () => {
    let syncer

    beforeEach(() => {
      syncer = new Syncer(config, MockPunch)
    })

    it('returns a promise', () => {
      expect(syncer._diff(manifest) instanceof Promise).toBe(true)
    })

    it('diffs properly', () => {
      expect.assertions(2)

      syncer._diff(manifest).then(({ uploads, downloads }) => {
        expect(uploads).toEqual([{
          id: 'two',
          project: 'test2',
          updated: 12754
        }])
        expect(downloads).toEqual(['one', 'three'])
      })
    })
  })

  describe('sync', () => {
    let syncer

    beforeEach(() => {
      syncer = new Syncer(config, MockPunch)
    })

    it('returns a promise', () => {
      expect(syncer.sync('dummy') instanceof Promise).toBe(true)
    })

    it('throws an error if the first parameter is not a string or a SyncService', () => {
      expect.assertions(1)

      expect(syncer.sync(5)).rejects.toEqual(
        new Error('First parameter must be a string or an instance of SyncService'))
    })

    it('calls .save() on downloaded punches', async () => {
      await syncer.sync(new MockService(config))
      expect(saved.length).toBe(3)
    })
  })
})
