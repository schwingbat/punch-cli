const formatCurrency = require("../../format/currency");

module.exports = () =>
  function(units) {
    return formatCurrency(units);
  };
