const format = require('format-currency');

const defaultOptions = { format: '%s%v', symbol: '$' };

module.exports = function(value, options) {
  return format(value, options || defaultOptions);
};