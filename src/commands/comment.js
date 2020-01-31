const parseDateTime = require("../utils/parse-datetime");
const { allPunchedIn, confirm } = require("../punch/utils");
const { dayPunches } = require("../logging/printing");
const chalk = require("chalk");
const formatDate = require("date-fns/format");
const handleSync = require("../utils/handle-sync");

module.exports = command =>
  command
    .description("add a comment to remember what you worked on")
    .arg("comment", {
      description: "a description of what you worked on",
      splat: true,
      parse: words => words.join(" ")
    })
    .flag("project", "p", {
      description: "the active project to add the comment to"
    })
    .flag("time", "t", {
      description: "set a custom timestamp for the comment (defaults to now)",
      parse: parseDateTime
    })
    .action(async (args, props) => {
      const { config, Punch } = props;

      const punchedIn = await allPunchedIn({ config, Punch });
      const { project, time } = args.flags;

      if (punchedIn.length > 1 && !project) {
        console.log(
          "\nYou are punched in on more than one project. Use the -p flag to specify which project to comment on."
        );
        let str = "";
        for (let i = 0; i < punchedIn.length; i++) {
          if (i == 0) {
            str += "  e.g. ";
          } else {
            str += "       ";
          }
          str += `punch comment -p ${punchedIn[i]} "${args.comment}"\n`;
        }
        console.log(str);
        return;
      }

      const current = await Punch.current(project);

      if (current) {
        current.addComment(args.comment, time || null);
        await current.save();

        console.log(
          "\n  " +
            dayPunches([current], Date.now(), config).replace(/\n/g, "\n  ")
        );
        console.log("Comment saved.");
        await handleSync({ config, Punch });
      } else {
        const latest = await Punch.latest();

        let inTime = latest.in;
        let outTime = latest.out;
        let date = Date.now();

        let format = "";

        if (inTime.day !== date || outTime.day !== date) {
          format = config.display.timeFormat + " " + config.display.dateFormat;
        } else {
          format = config.display.timeFormat;
        }

        inTime = formatDate(inTime, format);
        outTime = formatDate(outTime, format);

        let str = "\nYou're not punched in. Add to last punch?\n\n";
        str += "  " + dayPunches([latest], date, config).replace(/\n/g, "\n  ");
        str += "  " + chalk.green(` + ${args.comment}`);
        str += "\n\n";

        if (confirm(str)) {
          latest.addComment(args.comment, time || null);
          await latest.save();

          console.log("\nComment saved.");

          await handleSync({ config, Punch });
        }
      }
    });

// module.exports = ({ config, Punch }) => ({
//   signature: "comment <comment...>",
//   description: "add a comment to remember what you worked on",
//   arguments: [
//     {
//       name: "comment",
//       description: "a description of what you worked on",
//       parse: words => words.join(" ")
//     }
//   ],
//   options: [
//     {
//       name: "project",
//       short: "p",
//       description: "the active project to add the comment to",
//       type: "string"
//     },
//     {
//       name: "time",
//       short: "t",
//       description: "set a custom timestamp for the comment (defaults to now)",
//       type: parseDateTime
//     }
//   ],
//   run: async function(args) {
//     const punchedIn = await allPunchedIn({ config, Punch });

//     if (punchedIn.length > 1 && !args.options.project) {
//       console.log(
//         "\nYou are punched in on more than one project. Use the -p flag to specify which project to comment on."
//       );
//       let str = "";
//       for (let i = 0; i < punchedIn.length; i++) {
//         if (i == 0) {
//           str += "  e.g. ";
//         } else {
//           str += "       ";
//         }
//         str += `punch comment -p ${punchedIn[i]} "${args.comment}"\n`;
//       }
//       console.log(str);
//       return;
//     }

//     const current = await Punch.current(args.options.project);

//     if (current) {
//       current.addComment(args.comment, args.options.time || null);
//       await current.save();

//       console.log(
//         "\n  " +
//           dayPunches([current], Date.now(), config).replace(/\n/g, "\n  ")
//       );
//       console.log("Comment saved.");
//       await handleSync({ config, Punch });
//     } else {
//       const latest = await Punch.latest();

//       let inTime = latest.in;
//       let outTime = latest.out;
//       let date = Date.now();

//       let format = "";

//       if (inTime.day !== date || outTime.day !== date) {
//         format = config.display.timeFormat + " " + config.display.dateFormat;
//       } else {
//         format = config.display.timeFormat;
//       }

//       inTime = formatDate(inTime, format);
//       outTime = formatDate(outTime, format);

//       let str = "\nYou're not punched in. Add to last punch?\n\n";
//       str += "  " + dayPunches([latest], date, config).replace(/\n/g, "\n  ");
//       str += "  " + chalk.green(` + ${args.comment}`);
//       str += "\n\n";

//       if (confirm(str)) {
//         latest.addComment(args.comment, args.options.time || null);
//         await latest.save();

//         console.log("\nComment saved.");

//         await handleSync({ config, Punch });
//       }
//     }
//   }
// });
