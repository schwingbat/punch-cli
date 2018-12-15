const path = require('path')
const Storage = require('./punchfile.service')
const MockPunch = require('../../test/mocks/punch.mock')

const config = {
  punchPath: path.join(__dirname, '../../test/testpunches')
}

describe('PunchfileStorageService', () => {
  it('exports a function', () => {
    expect(typeof Storage).toBe('function')
  })

  describe('Storage Service API', () => {
    let api

    beforeEach(() => {
      api = Storage(config, MockPunch)
    })

    describe('save', () => {
      it('exports a save function', () => {
        expect(typeof api.save).toBe('function')
      })
    })

    describe('latest', () => {
      it('exports a latest function', () => {
        expect(typeof api.latest).toBe('function')
      })
    })

    describe('current', () => {
      it('exports a current function', () => {
        expect(typeof api.current).toBe('function')
      })
    })

    describe('select', () => {
      it('exports a select function', () => {
        expect(typeof api.select).toBe('function')
      })
    })
  })
})
