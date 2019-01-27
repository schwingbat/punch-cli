module.exports = () => ({
  signature: "month",
  description: "show a summary of punches for the current month (alias of \"punch log this month\")",
  hidden: true,
  run: function (args, { invoke }) {
    invoke("log this month");
  }
});