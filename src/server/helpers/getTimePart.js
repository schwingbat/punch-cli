module.exports = () =>
  function (time, part) {
    if (!time) {
      return "";
    }

    const [h, m] = time.split(":");

    switch (part.toLowerCase()) {
      case "h":
      case "hour":
        return h;
      case "m":
      case "minute":
        return m;
      default:
        return "";
    }
  };
