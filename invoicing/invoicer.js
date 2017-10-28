module.exports = function(config) {
  const formats = {};
  formats.pdf = require('./pdf.js');

  return {
    create(data, format) {
      if (!format) {
        return console.log(`No format specified for invoicer.create()`);
      } else if (!formats[format.toLowerCase()]) {
        return console.log(`Format ${format} not supported (yet?)`);
      }

      const formatter = formats[format.toLowerCase()];

      return formatter(data, data.output.path);
    }
  }
}