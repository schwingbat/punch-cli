const PDF = require('pdfkit');
const fs = require('fs');

module.exports = function(data, outPath) {
  const doc = new PDF();

  doc.pipe(fs.createWriteStream(outPath));

  doc.text('Test');
  
  doc.end();
}