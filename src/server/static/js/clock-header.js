(function () {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysJa = ["日", "月", "火", "水", "木", "金", "土"];

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
    "Dec",
  ];

  const init = () => {
    const date = document.querySelector(".clock-header__date");
    const time = document.querySelector(".clock-header__time");

    if (date == null || time == null) {
      return;
    }

    // const updateDate = () => {
    //   const now = new Date();
    //   const dow = now.getDay() % 7;
    //   const mo = now.getMonth();
    //   const dt = now.getDate();

    //   const value = `${days[dow]}, ${months[mo]} ${dt}`;

    //   date.innerHTML = value;
    // };

    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const m = now.getMinutes().toString().padStart(2, "0");
      let h = hours % 12;

      if (h === 0) {
        h = 12;
      }

      let meridiem = hours > 11 ? "PM" : "AM";

      const value = `${h}:${m} ${meridiem}`;

      time.innerHTML = value;
    };

    /*----- Japanese Style -----*/
    const updateDate = () => {
      const now = new Date();
      const dow = now.getDay() % 7;
      const mo = now.getMonth();
      const dt = now.getDate();

      const value = `${months[mo]} ${dt} <span class="color-gray">${daysJa[dow]}</span>`;

      date.innerHTML = value;
    };

    // const updateTime = () => {
    //   const now = new Date();
    //   const hours = now.getHours();
    //   const m = now.getMinutes();
    //   let h = hours % 12;

    //   let meridiem = hours > 11 ? "午後" : "午前";

    //   const value = `<sup style="font-size: 0.5em">${meridiem}</sup>${h}:${m}`;

    //   time.innerHTML = value;
    // };

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
