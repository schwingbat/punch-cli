const formatCurrency = require("../../format/currency");

module.exports = env => {
  env.addFilter("currency", formatCurrency);
};
