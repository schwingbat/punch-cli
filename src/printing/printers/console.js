const { promisify } = require("util");

module.exports = function () {
  return {
    print(...args) {
      process.stdout.write(
        args
          .map((arg) =>
            typeof arg.toString === "function" ? arg.toString() : arg
          )
          .join(" ")
      );
    },
  };
};
