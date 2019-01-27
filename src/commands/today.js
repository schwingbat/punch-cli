module.exports = () => ({
  signature: "today",
  description: "show a summary of today's punches (alias of \"punch log today\")",
  hidden: true,
  run: function (args, { invoke }) {
    invoke("log today");
  }
});