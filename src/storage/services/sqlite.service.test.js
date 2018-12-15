const Storage = require('./sqlite.service')

describe('SQLiteStorageService', () => {
  it('exports a function', () => {
    expect(typeof Storage).toBe('function')
  })
})
