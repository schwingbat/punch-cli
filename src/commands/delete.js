const { confirm } = require("../punch/utils");
const { dayPunches } = require("../logging/printing");

const { Command } = require("@ratwizard/cli");

module.exports = new Command()
  .usage("delete [--yes] <id>")
  .description("delete a punch")
  .arg("id", {
    description: "ID of a given punch (use `punch log --with-ids` to find IDs)"
  })
  .option("yes", "y", {
    description: "delete without confirmation",
    boolean: true
  })
  .action(async ({ args, options, props }) => {
    const { config, Punch } = props;

    const punch = await Punch.find(p => p.id === args.id);

    if (punch) {
      console.log(
        "\n  " + dayPunches([punch], punch.in, config).replace(/\n/g, "\n  ")
      );

      if (options.yes || confirm("Delete this punch?")) {
        punch.delete();
        console.log("BOOM! It's gone.");
      }
    } else {
      console.log("Punch not found");
    }
  });
