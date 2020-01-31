const { ascendingBy, descendingBy } = require("../utils/sort-factories");
const chalk = require("chalk");
const formatDistance = require("date-fns/formatDistance");
const Table = require("../format/table");

module.exports = command =>
  command.description("show tags you've used").action(async (argv, props) => {
    const { config, Punch } = props;

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
      counted.push({
        tag,
        count: byTag[tag].length
      });
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
        `last used ${formatDistance(lastSeen.out, new Date())} ago`
      ]);
    }

    console.log(table.toString());
  });
