// Defer requirement of modules until they're requested, and only require them once.
// Benchmarks show that the requires at the beginning of the main file are slowing
// everything down by a shitload.

const modules = {};

const moduleMap = [
  ['config', './files/config'],
  ['punchfile', './files/punchfile'],
  ['sqlish', './files/sqlish'],
  ['tracker', './files/tracker'],

  // Formatters
  ['datefmt', './formatting/time'],
  ['durationfmt', './formatting/duration'],
  ['currencyfmt', './formatting/currency'],
  ['summaryfmt', './formatting/projsummary'],
];

module.exports = (function() {
  moduleMap.forEach(m => {
    modules[m[0]] = entry(m[1]);
  });

  function entry(m) {
    return {
      path: m,
      loaded: false,
      ref: null,
    };
  }

  function load(m) {
    // If not required yet, require, then return reference(s)
    if (!modules[m]) modules[m] = entry(m);
    if (!modules[m].loaded) {
      const start = Date.now();
      modules[m].ref = require(modules[m].path);
      console.log(`Lazy: required module ${m} in ${Date.now() - start}ms`);
      modules[m].loaded = true;
    }
    return modules[m].ref;
  }

  function defer(m) {
    // Return a function that requires the module when called (if it's not loaded already.)
    return function() {
      load(m);
    }
  }

  return { load, defer };
})();
