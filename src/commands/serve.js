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
    .action(async (args, props) => {
      const { port } = args.flags;

      server.start({ port, props });
    });
