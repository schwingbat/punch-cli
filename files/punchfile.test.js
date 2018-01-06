const test = require('ava');
const Punchfile = require('./punchfile');

test('exports a function', t => {
  t.is(typeof Punchfile, 'function');
});

