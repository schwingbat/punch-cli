const { confirm } = require("../punch/utils");
const { dayPunches } = require("../logging/printing");
const handleSync = require("../utils/handle-sync");
const chalk = require("chalk");

module.exports = command =>
  command
    .description("replace an existing comment")
    .arg("punch-id", {
      key: "punchId",
      description:
        "ID of a given punch (use `punch log --with-ids` to find IDs)"
    })
    .arg("comment-index", {
      key: "commentIndex",
      description: "index of the comment to replace",
      parse: parseInt
    })
    .arg("new-comment", {
      key: "newComment",
      description: "new comment text"
    })
    .flag("update-timestamp", "u", {
      key: "updateTimestamp",
      description: "updates the comment's timestamp to the current time",
      boolean: true
    })
    .run(async ({ args, flags, props }) => {
      const { config, Punch } = props;

      const punch = await Punch.find(p => p.id === args.punchId);

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
            const id = punch.comments[args.commentIndex].id;
            const timestamp = flags.updateTimestamp && new Date();

            punch.editComment(id, args.newComment, timestamp);
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
    });
