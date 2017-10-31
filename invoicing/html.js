const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

module.exports = function(data, outPath) {
  const template = handlebars.compile(fs.readFileSync('invoicing/assets/templates/standard.hbs', 'utf8'));
  const html = template(data);
  
  fs.writeFileSync(outPath, html);
}