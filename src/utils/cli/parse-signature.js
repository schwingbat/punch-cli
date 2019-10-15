/**
 * Parse a command's signature (e.g. `comment <project> [comment...]`) into an arg map
 * that can be used to match user input.
 */

module.exports = function parseSignature(str) {
  let i = 0;
  let end = str.length;
  const argMap = [];

  let buffer = "";
  let inArg = false;
  let isRequired = false;
  let isVariadic = false;

  const addArg = () => {
    const obj = {
      name: buffer,
      required: isRequired,
      variadic: isVariadic
    };

    argMap.push(obj);
    buffer = "";

    inArg = false;
    isRequired = false;
    isVariadic = false;
  };

  while (i < end) {
    switch (str[i]) {
      case "<":
        inArg = true;
        isRequired = true;
        break;
      case ">":
        addArg();
        break;
      case "[":
        inArg = true;
        isRequired = false;
        break;
      case "]":
        addArg();
        break;
      case ".":
        if (inArg && buffer.length > 0) {
          let eq = str[i] === "." && str[i + 1] === "." && str[i + 2] === ".";

          if (eq) {
            i += 2;
            isVariadic = true;
          }
        }
        break;
      case " ":
        break;
      default:
        if (inArg) {
          buffer += str[i];
        }
        break;
    }

    i += 1;
  }

  if (buffer.length > 0) {
    if (inArg) {
      addArg();
    }
  }

  return argMap;
};
