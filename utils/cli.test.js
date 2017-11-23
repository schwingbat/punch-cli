const test = require('ava');
const CLI = require('./cli.js');

const {
  parseCmdString,
  mapArgs
} = CLI.___;

/*=======================*\
||      Args Parsing     ||
\*=======================*/

test('returns empty argMap array if no params are named', t => {
  const testString = 'command';

  t.deepEqual(parseCmdString(testString), []);
});

test('returns filled in argMap array for named params', t => {
  const testString = 'command :one :two :three';

  t.deepEqual(parseCmdString(testString), [
    {
      name: 'one',
      optional: false,
    },
    {
      name: 'two',
      optional: false,
    },
    {
      name: 'three',
      optional: false,
    },
  ]);
});

test('sets optional to true for params ending in "?"', t => {
  const testString = 'command :one :two?';

  t.deepEqual(parseCmdString(testString), [
    {
      name: 'one',
      optional: false,
    },
    {
      name: 'two',
      optional: true
    }
  ]);
});

/*=======================*\
||      Args Mapping     ||
\*=======================*/

test('maps args to empty object when no args are passed', t => {
  t.deepEqual(mapArgs([], []), {});
});

test('maps args to proper names', t => {
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

  t.deepEqual(mapArgs(args.slice(1), argMap), {
    one: 'fish',
    two: 'potato',
    number: '5'
  });
});