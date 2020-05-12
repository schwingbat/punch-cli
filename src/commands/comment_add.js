const handleSync = require("../utils/handle-sync");
const PunchFormatter = require("../format/punch");

const { Command } = require("@ratwizard/cli");

module.exports = new Command()
  .description("add a comment to a specific punch")
  .arg("punch-id", {
    key: "punchId",
    description: "ID of a given punch (use `punch log --with-ids` to find IDs)",
  })
  .arg("comment", {
    description: "comment text",
    splat: true,
    parse: (...words) => words.join(" "),
  })
  .action(async ({ args, props }) => {
    const { input, print, config, Punch } = props;

    const punch = await Punch.find((p) => p.id === args.punchId);

    if (punch) {
      const buf = print.buffer();

      buf.indent(2);
      buf.newline();

      const formatter = new PunchFormatter(
        new Punch({
          ...punch,
          comments: [
            ...punch.comments,
            new Punch.Comment(args.comment, new Date(), "TEMP_ID"),
          ],
        })
      );

      buf.push(formatter.header(), "\n");
      formatter.comments().forEach((comment) => {
        buf.push(
          comment.format({
            style: comment.id === "TEMP_ID" ? "add" : "normal",
          }),
          "\n"
        );
      });

      buf.newline();
      buf.dedent();
      buf.push("Add comment?");

      if (await input.confirm(buf)) {
        punch.addComment(args.comment);
        await punch.save();

        // Print updated punch details.
        const buf = print.buffer().newline().indent(2);

        const formatter = new PunchFormatter(punch);
        buf.push(formatter.header(), "\n");
        formatter.comments().forEach((comment, i) => {
          buf.push(comment.format(), "\n");
        });

        print(buf);

        console.log("\nComment added.");

        await handleSync({ config, Punch });
      }
    } else {
      console.log("Punch not found");
    }
  });
