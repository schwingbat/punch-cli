const rl = require("readline-sync");
const bcrypt = require("bcrypt");
const dedent = require("dedent");

const { Command } = require("@ratwizard/cli");

module.exports = new Command("server-hash")
  .description("hashes a password for use with `punch serve`")
  .examples([
    "Prompts after command is run to prevent passwords from being recorded in bash/shell history",
    " ",
    "$ punch server:hash",
    "Enter password: xxxx",
    "..."
  ])
  .action(async () => {
    const pass = rl.questionNewPassword("Enter password: ", {
      confirmMessage: "Confirm password: "
    });
    const hash = bcrypt.hashSync(pass, 10);

    console.log(dedent`
      Password hashed. Add this value to your punchconfig.json like so:

      ${hash}

      {
        ...
        "server": {
          "auth": {
            "passwordHash": "${hash}"
          }
        }
      }
    `);
  });
