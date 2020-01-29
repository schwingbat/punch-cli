module.exports = ({ Punch }) => ({
  signature: "rename-comment-object <from> <to>",
  description: "rename comment objects with name <from> to name <to>",
  hidden: true,
  examples: ["punch alias-rename task vsts"],
  arguments: [
    {
      name: "from",
      description: 'starting name (e.g. "task" for @task:1500)'
    },
    {
      name: "to",
      description: 'ending name (e.g. "vsts" to get @vsts:1500)'
    }
  ],
  run: async function(args) {
    const { from, to } = args;

    const punches = await Punch.select(p => {
      for (let c = 0; c < p.comments.length; c++) {
        for (let o = 0; o < p.comments[c].objects.length; o++) {
          if (p.comments[c].objects[o].key === from) {
            return true;
          }
        }
      }
    });

    punches.forEach(punch => {
      punch.comments.forEach(comment => {
        comment.objects.forEach(object => {
          if (object.key === from) {
            object.key = to;
          }
        });
      });
      punch.update();
      punch.save();
    });

    console.log(`${punches.length} punches updated`);
  }
});
