module.exports = function(ms) {
  let out = [];
  let seconds = ms / 1000;
  let minutes = seconds / 60;
  let hours = minutes / 60;

  if (minutes >= 1) {
    seconds -= 60 * ~~minutes;
  }

  if (hours >= 1) {
    minutes -= 60 * ~~hours;
  }

  if (hours >= 1) {
    out.push(~~hours + 'h');
  }

  if (minutes >= 1) {
    out.push(~~minutes + 'm');
  }

  if (seconds >= 1) {
    out.push(~~seconds + 's');
  }

  return out.join(' ');
}