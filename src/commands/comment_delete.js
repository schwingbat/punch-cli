const handleSync = require("../utils/handle-sync");
const PunchFormatter = require("../format/punch");

const { Command } = require("@ratwizard/cli");

module.exports = new Command()
  .description("delete a comment from a punch")
  .arg("punch-id", {
    key: "punchId",
    description: "ID of a given punch (use `punch log --with-ids` to find IDs)",
  })
  .arg("comment-index", {
    key: "commentIndex",
    description: "index of the comment to replace",
    parse: parseInt,
  })
  .action(async ({ args, props }) => {
    const { input, print, config, Punch } = props;

    const punch = await Punch.find((p) => p.id === args.punchId);

    if (punch) {
      if (punch.comments[args.commentIndex]) {
        const buf = print.buffer();

        buf.newline();
        buf.indent(2);

        const formatter = new PunchFormatter(punch);
        buf.push(formatter.header(), "\n");
        formatter.comments().forEach((comment, i) => {
          buf.push(
            comment.format({
              style: i === args.commentIndex ? "remove" : "normal",
            }),
            "\n"
          );
        });

        buf.dedent();
        buf.push("\nDelete comment?");

        if (await input.confirm(buf)) {
          const id = punch.comments[args.commentIndex].id;

          punch.deleteComment(id);
          await punch.save();

          // Print updated punch details.
          const buf = print.buffer().newline().indent(2);

          const formatter = new PunchFormatter(punch);
          buf.push(formatter.header(), "\n");
          formatter.comments().forEach((comment) => {
            buf.push(comment.format(), "\n");
          });

          print(buf);

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
