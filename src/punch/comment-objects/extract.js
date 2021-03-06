// Tags are allowed to have these characters in their names.
// Anything else will terminate the tag.
const tagNameRegex = /[a-zA-Z0-9-+_]/;

module.exports = function (comment) {
  const objects = [];
  const tags = [];

  let i = 0;

  while (i < comment.length) {
    let char = comment[i];

    // Parse @key:value object
    if (char === "@") {
      let startIndex = i;
      i++; // Skip @

      let keyStart = i;
      let keyEnd;
      let valueStart;

      let key = "";
      let value = "";
      let inValue = false;

      // Run until the next space or the end of the string
      while (comment[i] !== " " && i < comment.length) {
        char = comment[i];

        if (char === ":") {
          inValue = true;
          keyEnd = i;
          valueStart = i + 1;
          i++;
          continue;
        }

        if (inValue) {
          value += char;
        } else {
          key += char;
        }

        i++;
      }

      objects.push({
        start: startIndex,
        end: i,
        key: {
          start: keyStart,
          end: keyEnd,
          string: key,
        },
        value: {
          start: valueStart,
          end: i,
          string: value,
        },
      });

      continue;
    }

    // Parse #tag object
    // Tags can also take parameters like #tag[param, param]
    // Params can be handled by a custom tag formatter function when printed
    if (char === "#") {
      let startIndex = i;
      let inParams = false;
      let tagName = "";
      let params = [];
      let buf = "";

      i++; // Advance to the next character to skip the '#' delimiter.

      loop: while (i < comment.length) {
        if (inParams) {
          // Parse params list
          switch (comment[i]) {
            case ",":
              params.push(buf.trim());
              buf = "";
              break;
            case "]":
              inParams = false;
              params.push(buf.trim());
              break loop;
            default:
              buf += comment[i];
              break;
          }
        } else {
          switch (comment[i]) {
            case " ":
              break loop;
            case "[":
              inParams = true;
              break;
            default:
              if (tagNameRegex.test(comment[i])) {
                tagName += comment[i];
              } else {
                break loop;
              }
              break;
          }
        }

        i++;
      }

      tags.push({
        start: startIndex,
        end: i + 1,
        string: tagName,
        params,
      });

      continue;
    }

    i++;
  }

  return {
    comment: comment.trim(),
    objects,
    tags,
  };
};
