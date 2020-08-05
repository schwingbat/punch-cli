module.exports = () =>
  function (value) {
    if (typeof value === "string" && value[0] === "#" && value.length === 7) {
      return true;
    } else {
      return false;
    }
  };
