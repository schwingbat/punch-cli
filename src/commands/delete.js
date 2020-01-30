const { confirm } = require("../punch/utils");
const { dayPunches } = require("../logging/printing");

module.exports = command =>
  command
    .description("delete a punch")
    .arg("id", {
      description:
        "ID of a given punch (use `punch log --with-ids` to find IDs)"
    })
    .flag("yes", "y", {
      description: "delete without confirmation",
      boolean: true
    })
    .action(async (args, props) => {
      const { config, Punch } = props;

      const punch = (await Punch.select(p => p.id === args.id))[0];

      if (punch) {
        console.log(
          "\n  " + dayPunches([punch], punch.in, config).replace(/\n/g, "\n  ")
        );

        if (args.flags.yes || confirm("Delete this punch?")) {
          punch.delete();
          console.log("BOOM! It's gone.");
        }
      } else {
        console.log("Punch not found");
      }
    });
