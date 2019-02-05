module.exports = function (comment) {
  const objects = [];
  const tags = [];

  let i = 0;

  while (i < comment.length) {
    let char = comment[i];

    // Parse @key:value object
    if (char === "@") {
      // let startIndex = i;
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
        key: {
          start: keyStart,
          end: keyEnd,
          string: key
        },
        value: {
          start: valueStart,
          end: i,
          string: value
        }
      });

      continue;
    }

    // Parse #tag object
    if (char === "#") {
      let startIndex = i;

      // Run until the next space or the end of the string
      while (comment[i] !== " " && i < comment.length) {
        i++;
      }

      tags.push({
        start: startIndex,
        end: i,
        string: comment.slice(startIndex + 1, i)
      });

      continue;
    }

    i++;
  }

  return {
    comment: comment.trim(),
    objects,
    tags
  };
};
