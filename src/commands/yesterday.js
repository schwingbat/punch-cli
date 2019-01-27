module.exports = () => ({
  signature: "yesterday",
  description: "show a summary of yesterday's punches (alias of \"punch log yesterday\")",
  hidden: true,
  run: function (args, { invoke }) {
    invoke("log yesterday");
  }
});