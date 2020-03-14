const Handlebars = require("handlebars");

module.exports = props =>
  /**
   * Converts tags and comment objects to other HTML.
   */
  function(comment) {
    let text = comment.comment;

    for (const object of comment.objects) {
      switch (object.key.string) {
        case "wrike":
          text =
            text.slice(0, object.start) +
            `<a href="https://www.wrike.com/open.htm?id=${object.value.string}" target="_blank" rel="noopener noreferrer">${object.key.string}:${object.value.string}</a>` +
            text.slice(object.end);
          break;
        default:
          break;
      }
    }

    return new Handlebars.SafeString(`<span>${text}</span>`);
  };

function renderWrikeLink() {}
