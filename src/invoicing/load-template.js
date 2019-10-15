/*
  Loads template files in ./assets/{{name}}/*
  Concatenates CSS and passes it to the template as 'styles'
  Compiles the template with data and returns an HTML string
*/

const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const templatesPath = path.join(
  __dirname,
  "..",
  "resources",
  "templates",
  "invoice"
);
const MON = require("@schwingbat/mon");

function makeFontFace(font, fontDir) {
  let out = "@font-face {\n";

  out += `  font-family: "${font.name}";\n`;
  if (font.weight) {
    out += `  font-weight: ${font.weight};\n`;
  }
  if (font.style) {
    out += `  font-style: ${font.style};\n`;
  }

  out += `  src: `;
  const paths = (font.path ? [font.path] : font.paths).map(p =>
    path.join(fontDir, p)
  );
  paths.forEach((fontPath, i) => {
    const format = path
      .extname(fontPath)
      .toLowerCase()
      .slice(1);
    const encoded = `data:application/x-font-${format};charset=utf-8;base64,${fs
      .readFileSync(fontPath)
      .toString("base64")}`;
    out += `url("${encoded}") format("${format}")`;
    if (i + 1 < paths.length) {
      out += ",\n       ";
    } else {
      out += ";\n";
    }
  });

  out += "}\n";

  return out;
}

function loadTemplate(directory) {
  const entry = {
    template: null,
    styles: "",
    scripts: "",
    resources: directory,
    render: function(data) {
      return this.template({
        styles: this.styles,
        scripts: this.scripts,
        ...data
      });
    }
  };

  let manifest;
  if (fs.existsSync(path.join(directory, "template.mon"))) {
    manifest = MON.parse(
      fs.readFileSync(path.join(directory, "template.mon"), "utf8")
    );
  } else {
    manifest = JSON.parse(
      fs.readFileSync(path.join(directory, "template.json"), "utf8")
    );
  }

  if (manifest.fonts) {
    manifest.fonts.forEach(font => {
      const fontPath = path.join(directory, font, "font-face.mon");
      const fonts = MON.parse(fs.readFileSync(fontPath, "utf8"))["font-face"];
      fonts.forEach(f => {
        entry.styles += makeFontFace(f, path.dirname(fontPath));
      });
    });
  }

  if (manifest.css) {
    manifest.css.forEach(file => {
      entry.styles += fs.readFileSync(path.join(directory, file), "utf8");
    });
  }

  if (manifest.js) {
    manifest.js.forEach(file => {
      entry.scripts += "<script>\n";
      entry.scripts += fs.readFileSync(path.join(directory, file), "utf8");
      entry.scripts += "</script>\n";
    });
  }

  entry.template = handlebars.compile(
    fs.readFileSync(path.join(directory, manifest.template), "utf8")
  );

  return entry;
}

// Address Formatting //

handlebars.registerHelper("format-address", function(val) {
  let out = "";

  if (typeof val === "object") {
    out = `${val.street}\n${val.city}, ${val.state} ${val.zip}`;
  } else if (typeof val === "string") {
    out = val;
  }

  return out.replace("\n", "<br>");
});

// Comment Objects //

const objectLabels = {
  generic: loadTemplate(path.join(templatesPath, "_objects", "generic")),
  vsts: loadTemplate(path.join(templatesPath, "_objects", "vsts"))
};

handlebars.registerHelper("object-label", function(key, value, config = {}) {
  if (!objectLabels[key]) {
    return objectLabels.generic.render({ key, value, config });
  } else {
    return objectLabels[key].render({ key, value, config });
  }
});

// JSON formatting (for debugging) //

handlebars.registerHelper("json", function(object, pretty = false) {
  return JSON.stringify(object, null, pretty ? 2 : null);
});

module.exports = function(name, data) {
  return loadTemplate(
    path.isAbsolute(name) ? name : path.join(templatesPath, name),
    data
  );
};
