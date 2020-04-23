const readline = require("readline-sync");

exports.confirm = async function (query) {
  return readline.keyInYN(query);
};
