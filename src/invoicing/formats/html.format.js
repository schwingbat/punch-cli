module.exports = function(config, data, outPath) {
  return new Promise((resolve, reject) => {
    const loadTemplate = require("../load-template");
    const fs = require("fs");

    const html = loadTemplate(data.template || "standard").render(data);

    fs.writeFile(outPath, html, err => {
      if (err) return reject(err);
      return resolve();
    });
  });
};
