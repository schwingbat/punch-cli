const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

module.exports = async function(data, outPath) {
  const templateName = data.template || 'standard';
  const templatePath = path.join(__dirname, 'assets/templates', templateName + '.hbs');
 
  if (!fs.existsSync(templatePath)) {
    return console.error(`Template '${templateName}' doesn't exist in ${path.join(__dirname, 'assets/templates/')}`);
  }

  const template = handlebars.compile(fs.readFileSync(templatePath, 'utf8'))
  const html = template(data);
  
  fs.writeFileSync(outPath, html);
}