const Handlebars = require("handlebars");

/**
 * Takes a punch comment object and returns a version with tags
 * as links to the log with preset filters.
 */
module.exports = () =>
  function (comment) {
    let str = comment.comment;
    let cursor = 0;

    let segments = [];

    for (const tag of comment.tags) {
      let params = "";

      switch (tag.string) {
        case "wrike": {
          if (tag.params[0]) {
            let href = tag.params[0].replace(/\\/g, "");
            let match = href.match(/\?id=(\d+)$/);
            let label = match ? match[1] : "...";

            params = `<a class="tag-param-link" href="${href}">${label}</a>`;
          }
          break;
        }
        default:
          break;
      }

      let link = `<a class="tag-link ${
        params ? "-with-params" : ""
      }" href="/log?tag=${tag.string}">#${tag.string}</a>${params} `;
      let before = str.slice(cursor, tag.start);

      cursor = tag.end;

      segments.push(before, link);
    }

    segments.push(str.slice(cursor));

    const html = segments.join("");

    return new Handlebars.SafeString(html);
  };
