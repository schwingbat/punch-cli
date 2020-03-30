const server = require("../server/server");

const { Command } = require("@ratwizard/cli");

module.exports = new Command("serve")
  .description("start a local punch web server")
  .example("punch serve -p 8000")
  .option("port", "p", {
    description: "the local port to listen for HTTP requests",
    default: 5150,
    parse: parseInt
  })
  .option("no-open", "n", {
    key: "noOpen",
    description: "don't automatically open the page in a browser",
    boolean: true
  })
  .action(async ({ options, props }) => {
    const { port, noOpen } = options;

    server.start({ port, props, autoOpen: !noOpen });
    props.events.emit("server:started");
  });
