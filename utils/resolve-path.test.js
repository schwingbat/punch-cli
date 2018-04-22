const resolvePath = require('./resolve-path')
const os = require('os')

describe('resolvePath', () => {
  it(`Resolves a path starting with '~' into the user's home directory`, () => {
    expect(resolvePath('~/test/blah')).toBe(os.homedir() + '/test/blah')
  })
})
