(function() {
  let handlers = {};

  let secondsElapsed = new Date().getSeconds();
  let ticker;

  const events = {
    second: "second",
    minute: "minute"
  };

  const emit = eventName => {
    if (handlers[eventName]) {
      for (const handler of handlers[eventName]) {
        handler();
      }
    }
  };

  ticker = setInterval(() => {
    secondsElapsed += 1;
    emit("second");

    let currentSeconds = new Date().getSeconds();
    if (currentSeconds % 60 === 0) {
      emit("minute");
    }
  }, 1000);

  emit("second");
  emit("minute");

  window.Clock = {
    clear() {
      secondsElapsed = new Date().getSeconds();
      handlers = {};
    },

    on(eventName, fn) {
      const name = eventName.toLowerCase();

      if (!events[name]) {
        throw new Error(`Event ${name} is not supported.`);
      }

      if (!handlers[name]) {
        handlers[name] = [];
      }

      handlers[name].push(fn);
    }
  };

  document.addEventListener("DOMContentLoaded", Clock.clear);
  document.addEventListener("turbolinks:render", Clock.clear);
})();
