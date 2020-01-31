module.exports = command =>
  command
    .description("move all punches with project alias <from> to <to>")
    .example("punch project:rename oldname newname")
    .arg("from", {
      description: "project alias to target"
    })
    .arg("to", {
      description: "project alias to rename to"
    })
    .action(async (args, { Punch }) => {
      const { from, to } = args;

      const punches = await Punch.select(p => p.project === from);
      punches.forEach(punch => {
        punch.project = to;
        punch.update();
        punch.save();
      });

      console.log(`${punches.length} punches updated`);
    });
