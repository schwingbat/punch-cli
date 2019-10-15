module.exports = ({ config, Punch }) => ({
  signature: "delete <punchID>",
  description: "delete a punch",
  arguments: [
    {
      name: "punchID",
      description:
        'ID of a given punch (use "punch log --with-ids" to find IDs)'
    }
  ],
  options: [
    {
      name: "yes",
      short: "y",
      description: "delete without confirmation",
      type: "boolean"
    }
  ],
  run: async function(args) {
    const { confirm } = require("../punch/utils");
    const punch = (await Punch.select(p => p.id === args.punchID))[0];

    if (punch) {
      const { dayPunches } = require("../logging/printing");

      console.log(
        "\n  " + dayPunches([punch], punch.in, config).replace(/\n/g, "\n  ")
      );

      if (args.yes || confirm("Delete this punch?")) {
        punch.delete();
        console.log("BOOM! It's gone.");
      }
    } else {
      console.log("Punch not found");
    }
  }
});
