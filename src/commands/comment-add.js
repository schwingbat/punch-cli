const { confirm } = require("../punch/utils");
const { dayPunches } = require("../logging/printing");
const chalk = require("chalk");
const handleSync = require("../utils/handle-sync");

module.exports = command =>
  command
    .description("add a comment to a specific punch")
    .arg("punch-id", {
      key: "punchId",
      description:
        "ID of a given punch (use `punch log --with-ids` to find IDs)"
    })
    .arg("comment", {
      description: "comment text",
      splat: true,
      parse: words => words.join(" ")
    })
    .action(async (args, props) => {
      const { config, Punch } = props;

      const punch = (await Punch.select(p => p.id === args.punchId))[0];

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
    });
