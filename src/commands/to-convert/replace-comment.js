module.exports = ({ config, Punch }) => ({
  signature: "replace-comment <punchID> <commentIndex> <newComment>",
  description: "replace the text of an existing comment",
  arguments: [
    {
      name: "punchID",
      description:
        'ID of a given punch (use "punch log --with-ids" to find IDs)'
    },
    {
      name: "commentIndex",
      description: "index of the comment to edit",
      parse: val => parseInt(val)
    },
    {
      name: "newComment",
      description: "new comment content"
      // parse: (val) => parseInt(val)
    }
  ],
  run: async function(args) {
    const { confirm } = require("../../punch/utils");
    const { dayPunches } = require("../../logging/printing");
    const handleSync = require("../../utils/handle-sync");
    const chalk = require("chalk");

    const punch = (await Punch.select(p => p.id === args.punchID))[0];

    if (punch) {
      if (punch.comments[args.commentIndex]) {
        const lines = dayPunches([punch], punch.in, config)
          .split("\n")
          .filter(l => l != "");

        let str = "\n  " + lines.shift() + "\n  ";

        for (let i = 0; i < lines.length; i++) {
          if (i === args.commentIndex) {
            str +=
              "     " +
              chalk.red("- " + punch.comments[i].toStringPlain()) +
              "\n  ";
            str += "     " + chalk.green("+ " + args.newComment) + "\n  ";
          } else {
            str += "  " + lines[i] + "\n  ";
          }
        }

        str += "\nReplace comment?";

        if (confirm(str)) {
          // Set old comment to deleted
          punch.comments[args.commentIndex].comment = args.newComment;
          punch.update();
          await punch.save();

          console.log("\nComment replaced.");

          await handleSync({ config, Punch });
        }
      } else {
        // TODO: Do something if the punch ID doesn't match.
      }
    } else {
      console.log("Punch not found.");
    }
  }
});
