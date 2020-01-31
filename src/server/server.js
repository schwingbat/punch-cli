const { join } = require("path");
const express = require("express");
const exphbs = require("express-handlebars");
const open = require("open");

const datetimeHelper = require("./helpers/datetime.helper");

exports.start = function start({ port, props, autoOpen = true }) {
  const server = express();

  server.engine(
    "hbs",
    exphbs({
      extname: ".hbs",
      helpers: {
        datetime: datetimeHelper(props)
      }
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
  server.use("/", require("./routes/home"));
  server.use("/projects", require("./routes/projects"));

  server.listen(port, async () => {
    console.log(startMessage.replace(/%PORT%/g, port));

    if (autoOpen) {
      await open(`http://localhost:${port}`);
    }
  });
};

const startMessage = `
Server has started on port %PORT%. You can access it in a browser at http://localhost:%PORT%.
`;
