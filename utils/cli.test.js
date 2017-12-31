const test = require('ava');
const CLI = require('./cli.js');

const {
  parseSignature,
  mapArgs
} = CLI.___;

/*=======================*\
||      Args Parsing     ||
\*=======================*/

test('returns empty argMap array if no params are named', t => {
  t.deepEqual(parseSignature('command'), []);
});

test('returns filled in argMap array for named params', t => {
  t.deepEqual(parseSignature('command <one> <two> <three>'), [
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
  ]);
});

test('sets optional to true for params in [square brackets]', t => {
  t.deepEqual(parseSignature('command <one> [two]'), [
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
  ]);
});

test('sets multiple to true for params ending in "..."', t => {
  t.deepEqual(parseSignature('command <one> [two...]'), [
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
  ]);
});

test('sets splat to true for params beginning in "*"', t => {
  t.deepEqual(parseSignature('command <one> [*two]'), [
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