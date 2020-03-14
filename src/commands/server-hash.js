const rl = require("readline-sync");
const bcrypt = require("bcrypt");

module.exports = command =>
  command
    .description("hashes a password for use with `punch serve`")
    .examples([
      "Prompts after command is run to prevent passwords from being recorded in bash/shell history",
      " ",
      "$ punch server:hash",
      "Enter password: xxxx",
      "..."
    ])
    .run(async () => {
      const pass = rl.questionNewPassword("Enter password: ", {
        confirmMessage: "Confirm password: "
      });
      const hash = bcrypt.hashSync(pass, 10);

      console.log(`
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
