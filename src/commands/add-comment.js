module.exports = ({ config, Punch }) => ({
  signature: "add-comment <punchID> <comment...>",
  description: "add a comment to a specific punch",
  arguments: [
    {
      name: "punchID",
      description:
        'ID of a given punch (use "punch log --with-ids" to find IDs)'
    },
    {
      name: "comment",
      description: "comment text",
      parse: val => val.join(" ")
    }
  ],
  run: async function(args) {
    const { confirm } = require("../punch/utils");
    const { dayPunches } = require("../logging/printing");
    const chalk = require("chalk");
    const handleSync = require("../utils/handle-sync");

    const punch = (await Punch.select(p => p.id === args.punchID))[0];

    if (punch) {
      let str = "\n";

      str +=
        "  " + dayPunches([punch], punch.in, config).replace(/\n/g, "\n  ");
      str += "  " + chalk.green(` + ${args.comment}`);
      str += "\n\n";

      str += "Add comment?";

      if (confirm(str)) {
        punch.addComment(args.comment);
        punch.update();
        await punch.save();

        console.log("\nComment added.");

        await handleSync({ config, Punch });
      }
    } else {
      console.log("Punch not found");
    }
  }
});
