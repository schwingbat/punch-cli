const chalk = require("chalk");
const merge = require("mergerino");
const makeColorizer = require("./make-project-colorizer");

function isCharHeader(line) {
  return /^---/.test(line);
}

function isTransFrameHeader(line) {
  return /^--:/.test(line);
}

function isKeyValue(line) {
  return /^.+\:.+/.test(line);
}

function isComment(line) {
  return line.trim()[0] === "#";
}

function getCharName(line) {
  return line.replace(/---/g, "").trim();
}

function getKeyValue(line) {
  return line.split(":").map((x) => x.trim());
}

function getTransFrameInfo(line) {
  const frame = {};

  const [, from, to, timing] = line.match(
    /--:\s*(.+?)\s*>\s*(.+?)\s*\[(\d+)\]\s*:--/
  );

  frame.timing = Number(timing);
  frame.lines = [];

  return { from, to, frame };
}

function parseClockFile(clock) {
  // Parses a .clock file string into a clock object.

  const lines = clock.split("\n");
  const obj = {
    name: "clock",
    spaceCharacter: " ",
    characters: {},
    transitions: {},
  };

  // Lines can be either a 'key: value' format
  // or a '--- char ---' format
  // k:v lines only span a single line whereas
  // chars are parsed until the next char block

  let temp;
  let frameInfo;
  let i = 0;
  let inCharBlock = false;
  let inTransFrame = false;
  let charName;

  while (i < lines.length) {
    if (!isComment(lines[i])) {
      if (inTransFrame) {
        if (isCharHeader(lines[i]) || isTransFrameHeader(lines[i])) {
          inTransFrame = false;
          if (!obj.transitions[frameInfo.from]) {
            obj.transitions[frameInfo.from] = {};
          }
          if (!obj.transitions[frameInfo.from][frameInfo.to]) {
            obj.transitions[frameInfo.from][frameInfo.to] = [];
          }
          obj.transitions[frameInfo.from][frameInfo.to].push({
            lines: temp.filter((l) => l !== ""),
            timing: frameInfo.frame.timing,
          });
          i--;
        } else {
          temp.push(lines[i]);
        }
      } else if (inCharBlock) {
        if (isCharHeader(lines[i]) || isTransFrameHeader(lines[i])) {
          inCharBlock = false;
          // Filter out blank lines (spaces count as non-blank)
          obj.characters[charName] = temp.filter((l) => l !== "");
          i--;
        } else {
          temp.push(lines[i]);
        }
      } else {
        if (isCharHeader(lines[i])) {
          inCharBlock = true;
          temp = [];
          charName = getCharName(lines[i]);
        } else if (isTransFrameHeader(lines[i])) {
          inTransFrame = true;
          temp = [];
          frameInfo = getTransFrameInfo(lines[i]);
        } else if (isKeyValue(lines[i])) {
          const [key, value] = getKeyValue(lines[i]);
          obj[key] = value;
        }
      }
    }
    i++;
  }

  if (temp) {
    obj.characters[charName] = temp.filter((l) => l !== "");
  }

  return obj;
}

function colorizeChar(lines, spaceChar, colors) {
  return lines.map((line) => {
    return line
      .split("")
      .map((c) => {
        if (c === " ") {
          return spaceChar;
        } else {
          return makeColorizer({ color: colors.digit })(c);
        }
      })
      .join("");
  });
}

// Validate

function validate(characters) {
  const errors = [];

  for (const char in characters) {
    const { width, height, lines } = characters[char];

    if (lines.length !== height) {
      errors.push(
        `Character ${char} has a height of ${height}, but has ${lines.length} lines.`
      );
      continue;
    }

    lines.forEach((line, i) => {
      if (line.length !== width) {
        errors.push(
          `Line at index ${i} of character ${char} should be ${width} characters wide. Is ${line.length} wide.`
        );
      }
    });
  }

  return errors;
}

module.exports = function ({ style, letterSpacing, colors, animate }) {
  const path = require("path");
  const fs = require("fs");
  const printLength = require("./print-length");
  let clock;

  style = style || "clock-block";
  letterSpacing = letterSpacing || 1;

  colors = merge({ spaceCharacter: "grey", digit: "cyan" }, colors || {});

  try {
    const clockPath = path.join(
      global.appRoot,
      "resources",
      "clock-styles",
      style + ".clock"
    );
    const file = fs.readFileSync(clockPath, "utf8");
    clock = parseClockFile(file);
  } catch (err) {
    console.error(err);
    throw new Error("Failed to load clock style: " + style);
  }

  // const charErrors = validate(clock.characters)
  // // const transErrors = validate(clock)
  // if (charErrors.length > 0) {
  //   console.error(charErrors)
  // }

  let spaceChar = clock.spaceCharacter || " ";
  // Colorize space char if it's not blank and the color is a valid chalk function
  if (spaceChar !== " " && chalk[colors.spaceCharacter]) {
    spaceChar = chalk[colors.spaceCharacter](spaceChar);
  }

  // Map spaces to spaceChar and colorize other characters
  for (const char in clock.characters) {
    clock.characters[char] = colorizeChar(
      clock.characters[char],
      spaceChar,
      colors
    );
  }

  if (animate) {
    for (const from in clock.transitions) {
      for (const to in clock.transitions[from]) {
        clock.transitions[from][to] = clock.transitions[from][to].map(
          (char) => ({
            ...char,
            lines: colorizeChar(char.lines, spaceChar, colors),
          })
        );
      }
    }
  }

  let transitions = [];
  let value = "";

  return {
    display(string) {
      const chars = string.split("").map((c) => clock.characters[c]);

      let output = "";
      let height = Math.max(...chars.map((c) => c.length));

      if (animate) {
        // Set up transitions if values have changed.
        if (value.length === string.length && value !== string) {
          for (let i = 0; i < string.length; i++) {
            if (value[i] !== string[i]) {
              const from = value[i];
              const to = string[i];
              if (clock.transitions[from] && clock.transitions[from][to]) {
                let accumulatedTiming = 0;
                transitions[i] = clock.transitions[from][to].map((t) => {
                  accumulatedTiming += t.timing;
                  return {
                    ends: Date.now() + accumulatedTiming,
                    ...t,
                  };
                });
              }
            }
          }
        }
        value = string;

        // Update transition frames
        const now = Date.now();
        transitions.forEach((t, i) => {
          if (t && t.length > 0) {
            while (t[0] && t[0].ends < now) {
              t.shift();
            }
          }
          if (t && t.length === 0) {
            transitions[i] = null;
          }
        });
      }

      for (let row = 0; row < height; row++) {
        output += spaceChar;
        chars.forEach((char, i) => {
          if (animate && transitions[i] && transitions[i].length > 0) {
            output += transitions[i][0].lines[row];
          } else {
            output += char[row];
          }
          if (i + 1 !== chars.length) {
            output += spaceChar;
          }
        });
        output += spaceChar;
        output += "\n";
      }

      const length = printLength(output.split("\n")[0]);
      let padding = "";
      for (let i = 0; i < length; i++) {
        padding += spaceChar;
      }
      padding += "\n";
      return padding + output + padding;
    },
  };
};
