const is = require("@schwingbat/is");

module.exports = (props) =>
  function (thing, value) {
    const type = is.what(thing);

    switch (type) {
      case "array":
      case "string":
        return thing.includes(value);
      case "object":
        return Object.keys(thing).includes(value);
      default:
        return false;
    }
  };
