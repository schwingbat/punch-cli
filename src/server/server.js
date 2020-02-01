const { join } = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const exphbs = require("express-handlebars");
const open = require("open");

const formatDateTimeHelper = require("./helpers/formatDateTime");
const formatDateHelper = require("./helpers/formatDate");
const formatTimeHelper = require("./helpers/formatTime");
const formatLongDurationHelper = require("./helpers/formatLongDuration");
const formatShortDurationHelper = require("./helpers/formatLongDuration");

exports.start = function start({ port, props, autoOpen = true }) {
  const server = express();

  server.use(bodyParser.urlencoded({ extended: true }));

  server.engine(
    "hbs",
    exphbs({
      extname: ".hbs",
      helpers: {
        formatDateTime: formatDateTimeHelper(props),
        formatDate: formatDateHelper(props),
        formatTime: formatTimeHelper(props),
        formatLongDuration: formatLongDurationHelper(props),
        formatShortDuration: formatShortDurationHelper(props)
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
  server.use("/", require("./routes/dashboard"));
  server.use("/projects", require("./routes/projects"));
  server.use("/clients", require("./routes/clients"));
  server.use("/punch", require("./routes/punch"));
  server.use("/log", require("./routes/log"));

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
