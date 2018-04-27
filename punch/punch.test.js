const path = require('path')

const configPath = path.join(__dirname, '../test/testconfig.json')
// const brokenConfigPath = path.join(__dirname, '../test/brokentestconfig.json')
const MockStorage = require('../test/mocks/storage.mock')
const config = require('../config')
const _punch = require('./punch')

describe('Punch', () => {
  let Punch
  let mock
  let Storage

  beforeEach(() => {
    const mockStorage = MockStorage({ storageType: 'punchfile' })
    Storage = mockStorage.Storage
    mock = mockStorage.mock
    Punch = _punch(config(configPath), Storage)
  })

  describe('constructor', () => {
    it('instantiates', () => {
      expect(new Punch({ project: 'test' }) instanceof Punch).toBe(true)
    })

    it('generates a UUID if none is given', () => {
      const punch = new Punch({ project: 'test' })
      expect(typeof punch.id).toBe('string')
    })

    it('instantiates with comments', () => {
      const punch = new Punch({
        project: 'test',
        comments: [{
          comment: 'test 1',
          timestamp: 12345
        }, {
          comment: 'test 2',
          timestamp: 123456
        }]
      })

      expect(punch.comments.length).toBe(2)
    })

    it('creates comment objects if comments are plain strings', () => {
      const punch = new Punch({
        project: 'test',
        comments: ['test 1', 'test 2']
      })

      expect(punch.comments.length).toBe(2)
      expect(punch.comments[0].comment).toBeTruthy()
      expect(punch.comments[0].timestamp instanceof Date).toBe(true)
    })

    it('throws an error if first argument is not an object', () => {
      expect(() => new Punch('test')).toThrow()
    })

    it('throws an error if props object does not contain a project field', () => {
      expect(() => new Punch({ nope: true })).toThrow()
    })

    it('throws an error if props.project is not a string', () => {
      expect(() => new Punch({ project: 5 })).toThrow()
    })

    it('throws an error if out time is before in time', () => {
      const timeIn = new Date(2018, 3, 30, 14, 32)
      const timeOut = new Date(2018, 3, 30, 12, 30)

      expect(() => new Punch({ project: 'test', in: timeIn.getTime(), out: timeOut.getTime() })).toThrow()
    })
  })

  describe('addComment', () => {
    it('adds a comment', () => {
      const punch = new Punch({ project: 'test' })
      expect(punch.comments.length).toBe(0)

      punch.addComment('comment')
      expect(punch.comments.length).toBe(1)
      expect(punch.comments[0].comment).toBe('comment')
    })
  })

  describe('punchOut', () => {
    let punch

    beforeEach(() => {
      punch = new Punch({ project: 'test' })
    })

    it('sets punch.out value', () => {
      expect(punch.out).toBe(null)
      punch.punchOut()
      expect(punch.out).not.toBe(null)
    })

    it('adds a comment if one is passed', () => {
      expect(punch.comments.length).toBe(0)
      punch.punchOut('test comment')
      expect(punch.comments.length).toBe(1)
    })

    it('calls .save() if options.autosave is true', () => {
      punch.punchOut('test comment', { autosave: true })
      expect(mock.save.mock.calls.length).toBe(1)
    })

    it('uses time specified in options.time', () => {
      const time = new Date(2018, 4, 10, 15, 22, 12)
      punch.punchOut(null, { time: time })
      expect(punch.out.getTime()).toBe(time.getTime())
    })
  })

  describe('duration', () => {
    it('returns a value in milliseconds', () => {
      const punch = new Punch({ project: 'test' })
      expect(typeof punch.duration()).toBe('number')
    })

    it('calculates time correctly', () => {
      const punch = new Punch({ project: 'test' })
      punch.punchOut()
      expect(punch.duration()).toEqual(punch.out.getTime() - punch.in.getTime())
    })
  })

  describe('toJSON', () => {
    let data
    let data2
    let punch
    let punch2

    beforeAll(() => {
      let timeIn = new Date(2018, 1, 11, 9, 22, 10)
      let timeOut = new Date(2018, 1, 11, 11, 32, 58)

      data = {
        project: 'test',
        in: timeIn.getTime(),
        out: timeOut.getTime(),
        comments: [{
          comment: 'test comment',
          timestamp: timeOut.getTime()
        }],
        rate: 35.00,
        created: timeIn.getTime(),
        updated: timeOut.getTime()
      }

      data2 = Object.assign({}, data)
      data2.out = null

      punch = new Punch(data)
      punch2 = new Punch(data2)
    })

    it('converts to JSON', () => {
      const json = punch.toJSON()

      expect(typeof json.id).toBe('string')
      expect(typeof json.project).toBe('string')
      expect(typeof json.in).toBe('number')
      expect(typeof json.out).toBe('number')
      expect(typeof json.rate).toBe('number')
      expect(Array.isArray(json.comments)).toBe(true)
      expect(typeof json.created).toBe('number')
      expect(typeof json.updated).toBe('number')

      expect(json.in).toBe(data.in)
      expect(json.out).toBe(data.out)
      expect(json.rate).toBe(data.rate)
      expect(json.comments.length).toBe(1)
      expect(json.comments[0].comment).toBe('test comment')
      expect(json.comments[0].timestamp).toBe(data.out)

      const json2 = punch2.toJSON()

      expect(json2.out).toBe(null)
    })
  })

  describe('save', () => {
    it('calls storage.save', async () => {
      const punch = new Punch({ project: 'test' })
      await punch.save()
      expect(mock.save.mock.calls.length).toBe(1)
    })
  })

  describe('static', () => {
    describe('current', () => {
      it('calls storage.current', async () => {
        await Punch.current()
        expect(mock.current.mock.calls.length).toBe(1)
      })
    })

    describe('latest', () => {
      it('calls storage.latest', async () => {
        await Punch.latest()
        expect(mock.latest.mock.calls.length).toBe(1)
      })
    })

    describe('select', () => {
      it('calls storage.select', async () => {
        await Punch.select(() => true)
        expect(mock.select.mock.calls.length).toBe(1)
      })
    })

    describe('all', () => {
      it('calls storage.select', async () => {
        await Punch.all()
        expect(mock.select.mock.calls.length).toBe(1)
      })
    })
  })
})
