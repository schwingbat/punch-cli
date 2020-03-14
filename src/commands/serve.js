const server = require("../server/server");

module.exports = command =>
  command
    .description("start a local punch web server")
    .example("punch serve -p 8000")
    .flag("port", "p", {
      description: "the local port to listen for HTTP requests",
      default: 5150,
      parse: parseInt
    })
    .flag("no-open", "n", {
      key: "noOpen",
      description: "don't automatically open the page in a browser",
      boolean: true
    })
    .run(async ({ flags, props }) => {
      const { port, noOpen } = flags;

      server.start({ port, props, autoOpen: !noOpen });
    });
