const path = require('path')
const configPath = path.join(__dirname, '../test/testconfig.json')
const brokenConfigPath = path.join(__dirname, '../test/brokenconfig.json')
const config = require('../config')
const _Punch = require('./punch')

describe('Punch', () => {
  it('instantiates', () => {
    const conf = config(configPath)
    const Punch = _Punch(conf)

    expect(new Punch('test') instanceof Punch).toBe(true)
  })

  it('throws an error if a project references a nonexistent client', () => {
    const conf = config(brokenConfigPath)
    const Punch = _Punch(conf)
  })
})