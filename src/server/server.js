const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bodyParser = require("body-parser");
const exphbs = require("express-handlebars");
const open = require("open");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
const { ensureLoggedIn } = require("connect-ensure-login");
const withToken = require("./middleware/with-token");

const { join } = path;

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  done(null, { id: "local" });
});

exports.start = function start({ port, props, autoOpen = true }) {
  const server = express();
  const loggedIn = ensureLoggedIn("/login");

  passport.use(
    new LocalStrategy((username, password, done) => {
      const configHash = props.config.server.auth.passwordHash;

      bcrypt.compare(password, configHash, (err, result) => {
        if (err) {
          return done(err);
        }

        if (result == true) {
          return done(null, {
            id: "local",
          });
        }

        return done(null, false, { message: "Incorrect password" });
      });
    })
  );

  server.use(bodyParser.urlencoded({ extended: true }));
  server.use(bodyParser.json());
  server.use(
    session({
      secret: "topsecret",
      resave: false,
      saveUninitialized: false,
      store: new FileStore({
        path: path.join(props.config.punchPath, "server", "sessions")
      })
    })
  );
  server.use(flash());

  // Serve static files from './static' directory
  server.use(express.static(path.join(__dirname, "static")));

  server.engine(
    "hbs",
    exphbs({
      extname: ".hbs",
      helpers: initHelpers(props),
    })
  );
  server.set("view engine", "hbs");
  server.set("views", join(__dirname, "views"));

  // server.enable("view cache");

  // Make command props available on the request object.
  server.use((req, res, next) => {
    req.props = props;
    next();
  });

  server.use(passport.initialize());
  server.use(passport.session());

  server.get("/", (req, res) => {
    res.redirect("/dashboard");
  });

  // Configure routes
  server.use("/menu", loggedIn, require("./routes/menu"));
  server.use("/dashboard", loggedIn, require("./routes/dashboard"));
  server.use("/projects", loggedIn, require("./routes/projects"));
  server.use("/clients", loggedIn, require("./routes/clients"));
  server.use("/punch", loggedIn, require("./routes/punch"));
  server.use("/log", loggedIn, require("./routes/log"));
  server.use("/config", loggedIn, require("./routes/config"));
  server.use("/invoices", loggedIn, require("./routes/invoices"));
  server.use("/login", require("./routes/login"));

  server.use(
    "/api",
    withToken({
      tokens: props.config.server.auth.authTokens,
    }),
    require("./routes/api")
  );

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
