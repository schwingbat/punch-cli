const is = require("@schwingbat/is");

// Overrides for words with special cases.
const plurals = {
  invoice: "invoices",
};

module.exports = (props) =>
  function (word, numberOrThing) {
    const type = is.what(numberOrThing);
    let num;

    switch (type) {
      case "number":
        num = numberOrThing;
        break;
      case "array":
        num = numberOrThing.length;
        break;
      case "object":
        num = Object.keys(numberOrThing).length;
        break;
      default:
        num = 1;
    }

    if (num === 1) {
      return word;
    } else {
      return plurals[word.toLowerCase()] || word + "s";
    }
  };
