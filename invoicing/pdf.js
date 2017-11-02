const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const pdf = require('html-pdf');

module.exports = function(data, outPath) {
  return new Promise(resolve => {
    const templatePath = path.resolve('./invoicing/assets/templates/standard.hbs');
    const template = handlebars.compile(fs.readFileSync(templatePath, 'utf8'));
    const html = template(data);
    const options = {
      format: "Letter",
      border: "0.15in",
    };

    pdf.create(html, options).toFile(outPath, (err, res) => {
      if (err) return console.log('There was a problem writing to PDF:', err);

      return resolve();
    });
  });
}