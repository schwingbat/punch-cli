const resolvePath = require('./resolve-path')
const os = require('os')
const path = require('path')

describe('resolvePath', () => {
  it(`resolves a path starting with '~' into the user's home directory`, () => {
    expect(resolvePath('~/test/blah')).toBe(path.join(os.homedir(), 'test', 'blah'))
  })

  it('resolves a path not starting with \'~\'', () => {
    // works when run from punch root directory
    expect(resolvePath('./test')).toBe(path.join(__dirname, '..', 'test'))
  })
})
