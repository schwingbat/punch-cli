const Table = require('./table')

describe('Table', () => {
  it('instantiates', () => {
    const table = new Table()
    expect(table instanceof Table).toBe(true)
  })

  describe('push', () => {
    it('takes arrays of row items', () => {
      const table = new Table()
      table.push(
        ['one', 'two', 'three'],
        ['four', 'five', 'six']
      )
      expect(table.rows.length).toBe(2)
    })
  })

  describe('toString', () => {
    it('uh', () => {
      const table = new Table({
        columnStyle: [{
          align: 'left'
        }, {
          align: 'center'
        }, {
          align: 'right'
        }]
      })
      table.push(
        ['xxx', 'xxxxxx',  'xx'],
        ['xxxxx', 'xx', 'xxxxx']
      )
      expect(table.toString()).toEqual('xxx   xxxxxx    xx\nxxxxx   xx   xxxxx\n')
    })
  })
})