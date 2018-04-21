const CLI = require('./cli')

const {
  parseSignature,
  mapArgs
} = CLI.___;

/*=======================*\
||      Args Parsing     ||
\*=======================*/

describe('parseSignature', () => {
  it('returns empty argMap array if no params are named', () => {
    expect(parseSignature('command')).toEqual([])
  })

  it('returns filled in argMap array for named params', () => {
    expect(parseSignature('command <one> <two> <three>')).toEqual([
      {
        name: 'one',
        optional: false,
        multiple: false,
        splat: false,
      },
      {
        name: 'two',
        optional: false,
        multiple: false,
        splat: false,
      },
      {
        name: 'three',
        optional: false,
        multiple: false,
        splat: false,
      },
    ])
  })

  it('sets optional to true for params in [square brackets]', () => {
    expect(parseSignature('command <one> [two]')).toEqual([
      {
        name: 'one',
        optional: false,
        multiple: false,
        splat: false,
      },
      {
        name: 'two',
        optional: true,
        multiple: false,
        splat: false,
      }
    ])
  })

  it('sets multiple to true for params ending in "..."', () => {
    expect(parseSignature('command <one> [two...]')).toEqual([
      {
        name: 'one',
        optional: false,
        multiple: false,
        splat: false,
      },
      {
        name: 'two',
        optional: true,
        multiple: true,
        splat: false,
      },
    ])
  })

  it('sets splat to true for params beginning in "*"', () => {
    expect(parseSignature('command <one> [*two]')).toEqual([
      {
        name: 'one',
        optional: false,
        multiple: false,
        splat: false,
      },
      {
        name: 'two',
        optional: true,
        multiple: false,
        splat: true,
      },
    ])
  })

  it('throws an error if a param is both a splat and multiple', () => {
    expect(() => {
      parseSignature('command <*test...>')
    }).toThrow()
  })
})

/*=======================*\
||      Args Mapping     ||
\*=======================*/

describe('mapArgs', () => {
  it('maps args to empty object when no args are passed', () => {
    expect(mapArgs([], [])).toEqual({})
  })

  it('maps args to proper names', () => {
    const args = ['command', 'fish', 'potato', '5'];
    const argMap = [
      {
        name: 'one',
        optional: false,
      },
      {
        name: 'two',
        optional: false,
      },
      {
        name: 'number',
        optional: false,
      },
      {
        name: 'shark',
        optional: true
      }
    ];

    expect(mapArgs(args.slice(1), argMap)).toEqual({
      one: 'fish',
      two: 'potato',
      number: '5'
    })
  })
})