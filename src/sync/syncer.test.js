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
    it('throws an error if a config object is not passed as the first parameter', () => {
      expect(() => {
        Syncer()
      }).toThrow()
    })

    it('throws an error if a Punch constructor is not passed as the second parameter', () => {
      expect(() => {
        Syncer(config)
      }).toThrow()
    })
  })

  describe('loadService', () => {
    let syncer

    beforeEach(() => {
      syncer = Syncer(config, MockPunch)
    })

    it('loads a service module by name', () => {
      expect(syncer.loadService('dummy') instanceof DummyService).toBe(true)
    })

    it('throws an error if service is not configured in config file', () => {
      expect(() => syncer.loadService('asdf')).toThrow()
    })

    it('throws an error if service is configured but has no module', () => {
      expect(() => syncer.loadService('nonexistent')).toThrow()
    })

    it('throws an error if service is not a SyncService or a string', () => {
      expect(() => syncer.loadService(5)).toThrow()
    })
  })

  describe('diff', () => {
    let syncer

    beforeEach(() => {
      syncer = Syncer(config, MockPunch)
    })

    it('returns a promise', () => {
      expect(syncer.diff(manifest) instanceof Promise).toBe(true)
    })

    it('diffs properly', () => {
      expect.assertions(2)

      syncer.diff(manifest).then(({ uploads, downloads }) => {
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

    it('throws an error if the first parameter is not a sync service', () => {
      expect.assertions(4)

      expect(syncer.sync(5)).rejects.toBeTruthy()
      expect(syncer.sync('blah')).rejects.toBeTruthy()
      expect(syncer.sync({})).rejects.toBeTruthy()
      expect(syncer.sync(/test/)).rejects.toBeTruthy()
    })

    it('calls .save() on downloaded punches', async () => {
      await syncer.sync(new MockService(config))
      expect(saved.length).toBe(3)
    })
  })
})
