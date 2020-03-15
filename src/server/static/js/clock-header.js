(function() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];

  const init = () => {
    const date = document.querySelector(".clock-header__date");
    const time = document.querySelector(".clock-header__time");

    const updateDate = () => {
      const now = new Date();
      const dow = now.getDay() % 7;
      const mo = now.getMonth();
      const dt = now.getDate();

      const value = `${days[dow]}, ${months[mo]} ${dt}`;

      date.textContent = value;
    };

    const updateTime = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now
        .getMinutes()
        .toString()
        .padStart(2, "0");

      let meridiem = h > 11 ? "PM" : "AM";

      const value = `${h % 12}:${m} ${meridiem}`;

      time.innerHTML = value;
    };

    if (date) {
      Clock.on("minute", updateDate);
    }

    if (time) {
      Clock.on("minute", updateTime);
    }

    updateDate();
    updateTime();
  };

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("turbolinks:render", init);
})();
