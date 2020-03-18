module.exports = function(env) {
  /*=========================*\
  ||        Formatting       ||
  \*=========================*/

  env.addFilter("bold", value => "\033[1m" + value + "\033[21m");
  env.addFilter("dim", value => "\033[2m" + value + "\033[22m");
  env.addFilter("underlined", value => "\033[4m" + value + "\033[24m");
  env.addFilter("blink", value => "\033[5m" + value + "\033[25m");
  env.addFilter("inverted", value => "\033[7m" + value + "\033[27m");

  /*=========================*\
  ||          Colors         ||
  \*=========================*/

  const colorize = list => name => {
    const color = list[name.toLowerCase()];

    if (!color) {
      throw new Error(`${value} is not a valid color name.`);
    }

    return value => {
      return "\033[" + color + "m" + value + "\033[" + list.default + "m";
    };
  };

  /* ----- Foreground/text color ----- */

  const foreground = colorize({
    default: 39,
    black: 30,
    white: 97,
    red: 31,
    green: 32,
    yellow: 33,
    blue: 34,
    magenta: 35,
    cyan: 36,
    lightgray: 37,
    darkgray: 90,
    lightred: 91,
    lightgreen: 92,
    lightyellow: 93,
    lightblue: 94,
    lightmagenta: 95,
    lightcyan: 96
  });

  env.addFilter("color", (val, color) => foreground(color)(val));
  env.addFilter("black", foreground("black"));
  env.addFilter("white", foreground("white"));
  env.addFilter("red", foreground("red"));
  env.addFilter("green", foreground("green"));
  env.addFilter("yellow", foreground("yellow"));
  env.addFilter("blue", foreground("blue"));
  env.addFilter("magenta", foreground("magenta"));
  env.addFilter("cyan", foreground("cyan"));
  env.addFilter("lightgray", foreground("lightgray"));
  env.addFilter("darkgray", foreground("darkgray"));
  env.addFilter("lightred", foreground("lightred"));
  env.addFilter("lightgreen", foreground("lightgreen"));
  env.addFilter("lightyellow", foreground("lightyellow"));
  env.addFilter("lightblue", foreground("lightblue"));
  env.addFilter("lightmagenta", foreground("lightmagenta"));
  env.addFilter("lightcyan", foreground("lightcyan"));

  /* ----- Background color ----- */

  const background = colorize({
    default: 49,
    black: 40,
    white: 107,
    red: 41,
    green: 42,
    yellow: 43,
    blue: 44,
    magenta: 45,
    cyan: 46,
    lightgray: 47,
    darkgray: 100,
    lightred: 101,
    lightgreen: 102,
    lightyellow: 103,
    lightblue: 104,
    lightmagenta: 105,
    lightcyan: 106
  });

  env.addFilter("bg", (val, color) => background(color)(val));
  env.addFilter("bgblack", background("black"));
  env.addFilter("bgwhite", background("white"));
  env.addFilter("bgred", background("red"));
  env.addFilter("bggreen", background("green"));
  env.addFilter("bgyellow", background("yellow"));
  env.addFilter("bgblue", background("blue"));
  env.addFilter("bgmagenta", background("magenta"));
  env.addFilter("bgcyan", background("cyan"));
  env.addFilter("bglightgray", background("lightgray"));
  env.addFilter("bgdarkgray", background("darkgray"));
  env.addFilter("bglightred", background("lightred"));
  env.addFilter("bglightgreen", background("lightgreen"));
  env.addFilter("bglightyellow", background("lightyellow"));
  env.addFilter("bglightblue", background("lightblue"));
  env.addFilter("bglightmagenta", background("lightmagenta"));
  env.addFilter("bglightcyan", background("lightcyan"));
};
