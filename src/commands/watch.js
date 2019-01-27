const {
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay
} = require("date-fns");
const Clock = require("../utils/big-clock");
const formatCurrency = require("../format/currency");
const formatDuration = require("../format/duration");
const getLabelFor = require("../utils/get-label-for");
const logUpdate = require("log-update");
const messageFor = require("../utils/message-for");
const printLength = require("../utils/print-length");

module.exports = ({ config, Punch }) => ({
  signature: "watch",
  description: "continue running to show automatically updated stats of your current session",
  options: [{
    name: "animate",
    short: "a",
    type: "boolean",
    description: "enable animations for the clock"
  }],
  run: async function (args) {
    const active = await Punch.current();

    if (active) {
      const clock = Clock({
        style: "clock-block",
        letterSpacing: 1,
        animate: !!args.options.animate
      });

      const now = new Date();

      // Get total for month and day
      let monthlyTotal = 0;
      let dailyTotal = 0;

      // Total daily and monthly amounts.
      // Skip the active punch so we can just add its current pay() value
      // to get correct amounts for daily and monthly earnings.
      const punches = await Punch.select(p => p.in >= startOfMonth(now)
        && p.in <= endOfMonth(now)
        && p.id !== active.id);

      punches.forEach(p => {
        if (p.in >= startOfDay(now) && p.in <= endOfDay(now)) {
          dailyTotal += p.pay();
        }
        monthlyTotal += p.pay();
      });

      const update = () => {
        const duration = active.duration();
        const activePay = active.pay();
        const numbers = clock.display(formatDuration(duration, { style: "clock" }));

        let topLine = `Working on ${getLabelFor(config, active.project)}`;
        let bottomLine = "";

        // Don't bother showing money stats for unpaid projects.
        if (activePay > 0) {
          const money = formatCurrency(activePay);
          const numbersLength = printLength(numbers.split("\n")[0]);
          const monthly = formatCurrency(monthlyTotal + activePay) + " this month";
          const daily = formatCurrency(dailyTotal + activePay) + " today";

          topLine += money.padStart(numbersLength - topLine.length, " ");
          bottomLine = monthly + daily.padStart(numbersLength - monthly.length, " ");
        }

        logUpdate("\n" + topLine + "\n" + numbers + bottomLine);
      };

      update();
      setInterval(update, args.options.animate ? 64 : 1000);
    } else {
      console.log(messageFor("not-punched-in"));
    }
  }
});