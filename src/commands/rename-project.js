module.exports = ({ Punch }) => ({
  signature: "rename-project <from> <to>",
  description: "move all punches with project alias <from> to <to>",
  examples: ["punch alias-rename oldname newname"],
  arguments: [
    {
      name: "from",
      description: "project alias to target"
    },
    {
      name: "to",
      description: "project alias to rename to"
    }
  ],
  run: async function(args) {
    const { from, to } = args;

    const punches = await Punch.select(p => p.project === from);
    punches.forEach(punch => {
      punch.project = to;
      punch.update();
      punch.save();
    });

    console.log(`${punches.length} punches updated`);
  }
});
