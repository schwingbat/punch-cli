/**
 * Takes a punch and returns a starting point for the earnings ticker.
 */

module.exports = () =>
  function(punch) {
    const hours = ((punch.out || new Date()) - punch.in) / 3600000;
    return hours * punch.rate;
  };
