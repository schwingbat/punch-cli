module.exports = (props) =>
  function (one, two) {
    if (one < two) {
      return one;
    } else {
      return two;
    }
  };
