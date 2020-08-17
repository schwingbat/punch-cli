const path = require("path");
const fs = require("fs");

const messageDir = path.join(__dirname, "..", "..", "resources", "messages");

const cache = {};

module.exports = (props) =>
  function (key) {
    let messages = cache[key];

    if (messages == null) {
      messages = fs
        .readFileSync(path.join(messageDir, key), "utf-8")
        .split("\n");
      cache[key] = messages;
    }

    return messages[roll(messages.length)];
  };

function roll(length) {
  return ~~(Math.random() * (length - 1));
}
