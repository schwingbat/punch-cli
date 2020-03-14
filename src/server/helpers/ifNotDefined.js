module.exports = () =>
  function(value, fallback) {
    if (value != null) {
      return value;
    } else {
      return fallback;
    }
  };
