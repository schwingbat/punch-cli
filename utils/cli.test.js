const CLI = require('./cli')

const {
  parseSignature,
  mapArgs,
  applyArgExtras,
  requiredArgsProvided,
  makeHelp,
  makeGeneralHelp
} = CLI.___

const { command, run, invoke } = CLI({
  name: 'test',
  version: '0.0.0'
})

describe('CLI', () => {
  describe('internal', () => {
    /* ======================= *\
    ||       Args Parsing      ||
    \* ======================= */

    describe('parseSignature', () => {
      it('returns empty argMap array if no params are named', () => {
        expect(parseSignature('command')).toEqual([])
      })

      it('returns filled in argMap array for named params', () => {
        expect(parseSignature('command <one> <two> <three>')).toEqual([
          {
            name: 'one',
            required: true,
            variadic: false
          },
          {
            name: 'two',
            required: true,
            variadic: false
          },
          {
            name: 'three',
            required: true,
            variadic: false
          }
        ])
      })

      it('sets required to false for params in [square brackets]', () => {
        expect(parseSignature('command <one> [two]')).toEqual([
          {
            name: 'one',
            required: true,
            variadic: false
          },
          {
            name: 'two',
            required: false,
            variadic: false
          }
        ])
      })

      it('sets variadic to true for params ending in "..."', () => {
        expect(parseSignature('command <one> [two...]')).toEqual([
          {
            name: 'one',
            required: true,
            variadic: false
          },
          {
            name: 'two',
            required: false,
            variadic: true
          }
        ])
      })
    })

    /* ======================= *\
    ||       Args Mapping      ||
    \* ======================= */

    describe('mapArgs', () => {
      it('maps args to empty object when no args are passed', () => {
        expect(mapArgs([], [])).toEqual({})
      })

      it('maps args to proper names', () => {
        const args = ['command', 'fish', 'potato', '5']
        const argMap = [
          {
            name: 'one',
            required: true
          },
          {
            name: 'two',
            required: true
          },
          {
            name: 'number',
            required: true
          },
          {
            name: 'shark',
            required: false
          }
        ]

        expect(mapArgs(args.slice(1), argMap)).toEqual({
          one: 'fish',
          two: 'potato',
          number: '5'
        })
      })

      it('maps remaining items to variadic arguments as an array', () => {
        const args = ['one', 'two', 'three', 'four']
        const argMap = [
          {
            name: 'one',
            required: true,
            variadic: false
          },
          {
            name: 'two',
            required: false,
            variadic: true
          }
        ]

        expect(mapArgs(args, argMap)).toEqual({
          one: 'one',
          two: ['two', 'three', 'four']
        })
      })

      it('uses a default value if provided and argument is not given', () => {
        const args = ['one', 'two']
        const argMap = [
          {
            name: 'one',
            required: true,
            variadic: false
          },
          {
            name: 'two',
            required: true,
            variadic: false
          },
          {
            name: 'three',
            required: false,
            variadic: false,
            default: 'three'
          }
        ]

        expect(mapArgs(args, argMap)).toEqual({
          one: 'one',
          two: 'two',
          three: 'three'
        })
      })

      it('calls the parse function on an argument if given', () => {
        const args = ['one', 'two']
        const argMap = [
          {
            name: 'one',
            required: true,
            variadic: false
          },
          {
            name: 'two',
            required: true,
            variadic: false,
            parse: function (value) {
              return value.toUpperCase()
            }
          }
        ]

        expect(mapArgs(args, argMap)).toEqual({
          one: 'one',
          two: 'TWO'
        })
      })

      it('stores error object as arg._error if parse function throws', () => {
        const args = ['one']
        const argMap = [
          {
            name: 'test',
            required: true,
            variadic: false,
            parse: function (value) {
              throw new Error('test')
            }
          }
        ]

        mapArgs(args, argMap)
        expect(argMap[0]._error).toBeTruthy()
        expect(argMap[0]._error.message).toBe('test')
      })
    })

    describe('applyArgExtras', () => {
      let argMap

      beforeEach(() => {
        argMap = [{
          name: 'one',
          required: true,
          variadic: false
        }, {
          name: 'two',
          required: false,
          variadic: false
        }]
      })

      it('applies extra properties to an argMap', () => {
        let parseFunc = () => null

        expect(applyArgExtras(argMap, [{
          name: 'one',
          description: 'test description',
          default: 1
        }, {
          name: 'two',
          parse: parseFunc
        }])).toEqual([{
          name: 'one',
          required: true,
          variadic: false,
          description: 'test description',
          default: 1
        }, {
          name: 'two',
          required: false,
          variadic: false,
          parse: parseFunc
        }])
      })

      it('returns the argMap if no extras are passed', () => {
        expect(applyArgExtras(argMap)).toBe(argMap)
      })
    })

    describe('requiredArgsProvided', () => {
      it('returns true if all required args are provided and false if any are not', () => {
        const argMap = [{
          name: 'one',
          required: true,
          variadic: false
        }, {
          name: 'two',
          required: true,
          variadic: false
        }]

        expect(requiredArgsProvided({ one: 'one', two: 'two' }, argMap)).toBe(true)
        expect(requiredArgsProvided({ one: 'one' }, argMap)).toBe(false)
      })
    })
  })

  describe('API', () => {
    describe('command', () => {

    })

    describe('run', () => {

    })

    describe('invoke', () => {

    })
  })
})
