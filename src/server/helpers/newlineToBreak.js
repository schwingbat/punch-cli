const Handlebars = require("handlebars");

module.exports = props =>
  /**
   * Converts a \n or \r\n to an HTML <br>
   */
  function(string) {
    return new Handlebars.SafeString(string.replace(/\r?\n/g, "<br>"));
  };
