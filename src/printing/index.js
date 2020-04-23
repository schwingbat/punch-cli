const Buffer = require("./Buffer");

module.exports = function ({ config, printer }) {
  function print(...args) {
    printer.print(...args);
  }

  print.buffer = function () {
    return new Buffer();
  };

  return print;
};
