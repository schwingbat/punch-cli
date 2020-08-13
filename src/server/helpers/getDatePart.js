module.exports = () =>
  function (date, part) {
    if (!date) {
      return "";
    }

    const [y, m, d] = date.split("-");

    switch (part.toLowerCase()) {
      case "y":
      case "year":
        return y;
      case "m":
      case "month":
        return m;
      case "d":
      case "day":
        return d;
      default:
        return "";
    }
  };
