const units = {
  ms: 0,
  s: 1,
  m: 2,
  h: 3,
};

const unitAliases = {
  millisecond: "ms",
  milliseconds: "ms",

  second: "s",
  seconds: "s",

  minute: "m",
  minutes: "m",

  hour: "h",
  hours: "h",
};

module.exports = function formatDuration(milliseconds, opts = {}) {
  let resolution =
    units[unitAliases[opts.resolution] || opts.resolution || "s"];
  let padded = opts.padded || false;

  if (opts.fractional) {
    if (resolution === units.h) {
      return (milliseconds / 3600000).toFixed(1) + (opts.long ? " hours" : "h");
    } else if (resolution === units.m) {
      return (milliseconds / 60000).toFixed(1) + (opts.long ? " minutes" : "m");
    } else if (resolution === units.s) {
      return (milliseconds / 1000).toFixed(1) + (opts.long ? " seconds" : "s");
    }
  }

  let hours = milliseconds / 3600000;
  let minutes = 0;
  let seconds = 0;

  let remainder = hours - ~~hours;
  hours = ~~hours;
  minutes = remainder * 60;
  remainder = minutes - ~~minutes;
  minutes = ~~minutes;
  seconds = remainder * 60;
  remainder = seconds - ~~seconds;
  seconds = ~~seconds;
  milliseconds = Math.round(remainder * 1000);

  if (resolution > 0) {
    seconds += Math.round(milliseconds / 1000);
  }
  if (resolution > 1 || seconds === 60) {
    minutes += Math.round(seconds / 60);

    if (seconds === 60) {
      seconds = 0;
    }
  }
  if (resolution > 2) {
    hours += Math.round(minutes / 60);
  }

  // Wrap 60 minutes to avoid the 4h 60m bug.
  if (minutes === 60 && hours > 0) {
    minutes -= 60;
    hours += 1;
  }

  const parts = {};

  if (resolution <= units.h) {
    if (resolution === units.h || hours > 0 || opts.showHours) {
      parts.hours = hours;
    }
  }
  if (resolution <= units.m) {
    if (resolution === units.m || minutes > 0 || hours > 0) {
      parts.minutes = minutes;
    }
  }
  if (resolution <= units.s) {
    if (resolution === units.s || seconds > 0 || minutes > 0 || hours > 0) {
      parts.seconds = seconds;
    }
  }
  if (resolution <= units.ms) {
    if (
      resolution === units.ms ||
      milliseconds > 0 ||
      seconds > 0 ||
      minutes > 0 ||
      hours > 0
    ) {
      parts.milliseconds = milliseconds;
    }
  }

  if (opts.style === "clock") {
    const h = (parts.hours || 0).toString().padStart(2, "0");
    const m = (parts.minutes || 0).toString().padStart(2, "0");
    const s = (parts.seconds || 0).toString().padStart(2, "0");

    return `${h}:${m}:${s}`;
  } else if (opts.style === "japanese") {
    let out = [];

    if ("hours" in parts) {
      let hourString = parts.hours.toString();

      // Add commas
      if (hourString.length > 3) {
        const chars = [];
        const rev = hourString.split("").reverse();
        for (let i = 0; i < rev.length; i++) {
          chars.push(rev[i]);
          if (i !== 0 && i !== rev.length - 1 && (i + 1) % 3 === 0) {
            chars.push(",");
          }
        }
        hourString = chars.reverse().join("");
      }

      let hours = hourString + "時";
      out.push(hours);
    }

    if ("minutes" in parts) {
      let minutes = parts.minutes + "分";
      if (padded && "hours" in parts) {
        minutes = minutes.padStart(3);
      }
      out.push(minutes);
    }

    if ("seconds" in parts) {
      let seconds = parts.seconds + "秒";
      if (padded && ("minutes" in parts || "hours" in parts)) {
        seconds = seconds.padStart(3);
      }
      out.push(seconds);
    }

    return out.join("");
  } else {
    let out = [];

    if ("hours" in parts) {
      let hourString = parts.hours.toString();

      // Add commas
      if (hourString.length > 3) {
        const chars = [];
        const rev = hourString.split("").reverse();
        for (let i = 0; i < rev.length; i++) {
          chars.push(rev[i]);
          if (i !== 0 && i !== rev.length - 1 && (i + 1) % 3 === 0) {
            chars.push(",");
          }
        }
        hourString = chars.reverse().join("");
      }

      let hours = hourString + (opts.long ? " hours" : "h");
      out.push(hours);
    }

    if ("minutes" in parts) {
      let minutes = parts.minutes + (opts.long ? " minutes" : "m");
      if (padded && "hours" in parts) {
        minutes = minutes.padStart(3);
      }
      out.push(minutes);
    }

    if ("seconds" in parts) {
      let seconds = parts.seconds + (opts.long ? " seconds" : "s");
      if (padded && ("minutes" in parts || "hours" in parts)) {
        seconds = seconds.padStart(3);
      }
      out.push(seconds);
    }

    if ("milliseconds" in parts) {
      let milliseconds =
        parts.milliseconds + (opts.long ? " milliseconds" : "ms");
      out.push(milliseconds);
    }

    if (opts.long) {
      let str = "";
      out.forEach((part, i) => {
        str += part;
        if (i + 2 === out.length) {
          str += " and ";
        } else if (i + 1 < out.length) {
          str += ", ";
        }
      });
      return str;
    } else {
      return out.join(" ");
    }
  }
};
