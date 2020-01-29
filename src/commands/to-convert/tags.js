module.exports = ({ config, Punch }) => ({
  signature: "tags",
  description: "show tags you've used",
  arguments: [],
  options: [
    // {
    //   name: "option",
    //   short: "o",
    //   description: "description for the help section",
    //   type: "string"
    // }
  ],
  run: async function(args) {
    const { ascendingBy, descendingBy } = require("../../utils/sort-factories");
    const chalk = require("chalk");
    const distanceInWords = require("date-fns/distanceInWords");
    const Table = require("../../format/table");

    // Do something
    // Access args at args.name
    // Access option flag values at args.options.name
    const byTag = {};

    const punches = await Punch.all();
    for (const punch of punches) {
      for (const comment of punch.comments) {
        for (const tag of comment.tags) {
          if (!byTag[tag.string]) {
            byTag[tag.string] = [];
          }

          byTag[tag.string].push(punch);
        }
      }
    }

    const counted = [];
    const tags = Object.keys(byTag);

    for (const tag of tags) {
      byTag[tag].sort(descendingBy("out"));
      counted.push({ tag, count: byTag[tag].length });
    }

    counted.sort(ascendingBy("tag"));

    const table = new Table({
      columnStyle: [
        {
          align: "left",
          leftPadding: 1,
          rightPadding: 1
        },
        {
          align: "left",
          leftPadding: 1,
          rightPadding: 1
        },
        {
          align: "left",
          leftPadding: 1,
          rightPadding: 1
        }
      ]
    });

    console.log();
    for (const item of counted) {
      const lastSeen = byTag[item.tag][0];

      table.push([
        chalk.magenta(`#${item.tag}`),
        `${item.count} punch${item.count == 1 ? "" : "es"}`,
        `last used ${distanceInWords(lastSeen.out, new Date())} ago`
      ]);
    }

    console.log(table.toString());
  }
});
