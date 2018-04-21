const defaultConfig = require('./default.json')

describe('Config', () => {
  it('loads the default config if none exists', () => {
    process.env.PUNCH_CONFIG_PATH = '/dev/null'
    const config = require('./index')
    
    expect(config).toEqual(defaultConfig)
  })
})