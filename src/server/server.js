const { join } = require("path");
const express = require("express");
const exphbs = require("express-handlebars");

// ----- Init ----- //

const server = express();

server.engine(".hbs", exphbs({ extname: ".hbs" }));
server.set("view engine", ".hbs");
server.set("views", join(__dirname, "views"));

server.enable("view cache");

// ----- Exports ----- //

exports.start = function start({ port, props }) {
  // Make command props available on the request object.
  server.use((req, res, next) => {
    req.props = props;
    next();
  });

  server.use("/", require("./routes/home"));
  server.use("/projects", require("./routes/projects"));

  server.listen(port, () => {
    console.log(startMessage.replace(/%PORT%/g, port));
  });
};

const startMessage = `
Server has started on port %PORT%. You can access it in a browser at http://localhost:%PORT%.
`;
