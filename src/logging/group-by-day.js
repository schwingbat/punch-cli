// Group punches by day, ordered by date.
module.exports = function (punches) {
  const { ascendingBy } = require("../utils/sort-factories");
  const byDay = {};

  punches.forEach(punch => {
    let year = punch.in.getFullYear();
    let month = punch.in.getMonth() + 1;
    let day = punch.in.getDate();
    let out = punch.out || new Date();
    const keyIn = `${year}-${month}-${day}`;
    const keyOut = `${out.getFullYear()}-${out.getMonth() + 1}-${out.getDate()}`;

    if (!byDay[keyIn]) {
      byDay[keyIn] = [];
    }
    if (!byDay[keyOut]) {
      byDay[keyOut] = [];
    }

    byDay[keyIn].push(punch);
    if (keyIn !== keyOut) {
      byDay[keyOut].push(punch);
    }
  });

  const days = [];

  for (const key in byDay) {
    const [y, m, d] = key.match(/^(\d+)[-](\d+)[-](\d+)$/).slice(1, 4).map(Number);
    const date = new Date(y, m - 1, d);

    const punches = byDay[key].sort(ascendingBy("in"));

    // if (date.getDate() !== out.getDate()) {
    //   // Start and end are not on the same day.
    //   date.setHours()
    // } else {
    //   date.setHours(0, 0, 0, 0)
    // }
    // date.setHours(0, 0, 0, 0)

    days.push({ date, punches });
  }

  return days.sort(ascendingBy("date"));
};
