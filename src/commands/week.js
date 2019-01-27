module.exports = () => ({
  signature: "week",
  description: "show a summary of punches for the current week (alias of \"punch log this week\")",
  hidden: true,
  run: function (args, { invoke }) {
    invoke("log this week");
  }
});