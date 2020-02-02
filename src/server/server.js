const { join } = require("path");
const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const exphbs = require("express-handlebars");
const open = require("open");

exports.start = function start({ port, props, autoOpen = true }) {
  const server = express();

  server.use(bodyParser.urlencoded({ extended: true }));

  // Serve static files from './static' directory
  server.use(express.static(path.join(__dirname, "static")));

  server.engine(
    "hbs",
    exphbs({
      extname: ".hbs",
      helpers: initHelpers(props)
    })
  );
  server.set("view engine", "hbs");
  server.set("views", join(__dirname, "views"));

  server.enable("view cache");

  // Make command props available on the request object.
  server.use((req, res, next) => {
    req.props = props;
    next();
  });

  // Configure routes
  server.use("/", require("./routes/dashboard"));
  server.use("/projects", require("./routes/projects"));
  server.use("/clients", require("./routes/clients"));
  server.use("/punch", require("./routes/punch"));
  server.use("/log", require("./routes/log"));
  server.use("/config", require("./routes/config"));
  server.use("/invoices", require("./routes/invoices"));

  server.listen(port, async () => {
    console.log(startMessage.replace(/%PORT%/g, port));

    if (autoOpen) {
      await open(`http://localhost:${port}`);
    }
  });
};

/**
 * Loads helpers from ./helpers folder. All helpers will have names matching their file names, minus the extension.
 *
 * @param {*} props
 */
function initHelpers(props) {
  const helpersPath = path.join(__dirname, "helpers");
  const pathContents = fs.readdirSync(helpersPath);

  let helpers = {};

  for (const file of pathContents) {
    const { name, base } = path.parse(file);
    const fullPath = path.join(helpersPath, base);

    helpers[name] = require(fullPath)(props);
  }

  return helpers;
}

const startMessage = `
Server has started on port %PORT%. You can access it in a browser at http://localhost:%PORT%.
`;
