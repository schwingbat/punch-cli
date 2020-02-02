// ----- Example ----- //

// <ul class="stats-list">
//   <li>
//     <span class="label">Worked for</span>
//     <span
//       data-ticker="duration"
//       data-ticker-value="{{ dateDiffInMs in out }}">
//         {{ formatLongDuration in out }}
//     </span>
//   </li>
//   <li>
//     <span class="label">Earned</span>
//     <span
//       data-ticker="currency"
//       data-ticker-value="{{ pay }}"
//       data-ticker-hourly-rate="{{ hourlyRate }}">
//         {{ formatCurrency pay }}
//     </span>
//   </li>
// </ul>

const Ticker = (function() {
  /**
   * Core functions.
   */

  const bindingTypes = {
    duration: element => {
      let startValue = parseInt(
        element.getAttribute("data-ticker-value") || Date.now().toString()
      );

      return {
        startValue,
        boundAt: Date.now(),
        element,
        value() {
          // Initial value + time since bound.
          const val = this.startValue + (Date.now() - this.boundAt);
          return format(val, { style: "punch" });
        },
        apply() {
          this.element.innerHTML = this.value();
        }
      };
    },
    currency: element => {
      let startValue = Number(element.getAttribute("data-ticker-value") || 0);
      let hourlyRate = Number(
        element.getAttribute("data-ticker-hourly-rate") || 0
      );

      // Rate per millisecond.
      let rate = hourlyRate / 60 / 60 / 1000;

      return {
        startValue,
        rate,
        boundAt: Date.now(),
        element,
        value() {
          const val = this.startValue + this.rate * (Date.now() - this.boundAt);
          return `$${val.toFixed(2)}`;
        },
        apply() {
          this.element.innerHTML = this.value();
        }
      };
    }
  };

  let bindings = [];

  const format = (milliseconds, opts = {}) => {
    opts.style = opts.style || "clock";

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

    if (opts.style === "clock") {
      let parts = [];

      parts.push(seconds);

      if (minutes > 0 || hours > 0) {
        parts.push(minutes);
      }

      if (hours > 0) {
        parts.push(hours);
      }

      return parts
        .map(val => val.toString().padStart(2, "0"))
        .reverse()
        .join(":");
    } else if (opts.style === "punch") {
      let parts = [];

      parts.push(seconds + "s");

      if (minutes > 0 || hours > 0) {
        parts.push(minutes + "m");
      }

      if (hours > 0) {
        parts.push(hours + "h");
      }

      return parts
        .map(val => val.toString())
        .reverse()
        .join(" ");
    } else {
      throw new Error("Unknown style option: " + opts.style);
    }
  };

  const bind = (element, type) => {
    const binder = bindingTypes[type];

    if (!binder) {
      throw new Error("No binding type " + type + "!");
    }

    return binder(element);
  };

  const tick = () => {
    requestAnimationFrame(() => {
      for (const bound of bindings) {
        bound.apply();
      }
    });
  };

  /**
   * Elements with data-ticker-enabled="false" are not bound.
   */
  const tickerEnabled = element => {
    const enabledAttr = element.getAttribute("data-ticker-enabled");
    let isEnabled = true;

    if (enabledAttr && enabledAttr.toLowerCase() === "false") {
      isEnabled = false;
    }

    return isEnabled;
  };

  /**
   * Exports
   */

  let tickerInterval = null;

  return {
    init() {
      // Rebind elements.
      bindings = [];

      const tickables = document.querySelectorAll("[data-ticker]");

      for (const element of tickables) {
        if (tickerEnabled(element)) {
          const type = element.getAttribute("data-ticker").toLowerCase();
          bindings.push(bind(element, type));
        }
      }

      // Tick once immediately to update dates.
      tick();

      if (!tickerInterval) {
        tickerInterval = setInterval(tick, 1000);
      }
    },

    addBinding(binding) {
      // A binding is any object with a value() function returning a string.
      bindings.push(binding);
    }
  };
})();

// Works whether Turbolinks is enabled or not.
document.addEventListener("DOMContentLoaded", Ticker.init);
document.addEventListener("turbolinks:render", Ticker.init);
