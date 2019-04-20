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

    console.log(byTag);
  }
});
