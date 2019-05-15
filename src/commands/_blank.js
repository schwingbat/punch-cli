/**
 * An example command for reference.
 */
module.exports = ({ config, Punch }) => ({
  /**
   * The signature should include the command name followed by positional arguments
   * This string is used verbatim by the --help command.
   * The markers around arguments (as well as names) are significant:
   *   a <param> is required
   *   a [param] is optional
   *   a param... groups any arguments after this point into one argument
   */
  signature: "command [argument]",

  /**
   * A description of the command's purpose gives the user a hint about why they might use it.
   */
  description: "stop tracking time",

  /**
   * Arguments are identified by name (which must match the one in the signature), explained
   * by a description and -- optionally -- parsed by a custom function. Arguments without
   * a function are simply passed as strings. This function might be helpful for splitting
   * a comma separated list into an array of values, or turning a numeric argument into an
   * actual number.
   */
  arguments: [
    {
      name: "argument",
      description: "description for the help section",
      parse: value => value.split(",")
    }
  ],

  /**
   * Options are your standard -f, --flag, --flag=value type parameters. The `type` field
   * can be a type name or a function used to parse the string value into whatever you need.
   */
  options: [
    {
      name: "option",
      short: "o",
      description: "description for the help section",
      type: "string"
    }
  ],

  /**
   * The `run` function is where the action happens. Put your actual command logic here.
   */
  run: async function(args) {
    // Do something
    // Access args at args.name
    // Access option flag values at args.options.name
  }
});
