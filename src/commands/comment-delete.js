const { confirm } = require("../punch/utils");
const { dayPunches } = require("../logging/printing");
const handleSync = require("../utils/handle-sync");
const chalk = require("chalk");

module.exports = command =>
  command
    .description("delete a comment from a punch")
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
    .action(async (args, props) => {
      const { config, Punch } = props;

      const punch = (await Punch.select(p => p.id === args.punchId))[0];

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
            } else {
              str += "  " + lines[i] + "\n  ";
            }
          }

          str += "\nDelete comment?";

          if (confirm(str)) {
            // Set deleted to true and the storage service will handle the rest
            punch.comments[args.commentIndex].deleted = true;
            punch.update();
            await punch.save();

            console.log("\nComment deleted.");

            await handleSync({ config, Punch });
          }
        } else {
          console.log("No comment found at index " + args.commentIndex);
        }
      } else {
        console.log("Punch not found.");
      }
    });
