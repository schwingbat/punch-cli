module.exports = ({ config, Punch }) => ({
  signature: "command [argument]",
  description: "stop tracking time",
  arguments: [
    {
      name: "argument",
      description: "description for the help section"
    }
  ],
  options: [
    {
      name: "option",
      short: "o",
      description: "description for the help section",
      type: "string"
    }
  ],
  run: async function(args) {
    // Do something
    // Access args at args.name
    // Access option flag values at args.options.name
  }
});
