module.exports = props =>
  function(one, two) {
    one = new Date(one || new Date()).getTime();
    two = new Date(two || new Date()).getTime();

    const greater = Math.max(one, two);
    const lesser = Math.min(one, two);

    return greater - lesser;
  };
