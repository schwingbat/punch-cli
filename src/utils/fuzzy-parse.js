/*
  Takes a fuzzy string like "two days ago" or "last wednesday"
  and makes it into a useful Interval.
*/
const startOfDay = require("date-fns/startOfDay");
const endOfDay = require("date-fns/endOfDay");
const addDays = require("date-fns/addDays");
const differenceInDays = require("date-fns/differenceInDays");
const differenceInHours = require("date-fns/differenceInHours");
const startOfWeek = require("date-fns/startOfWeek");
const endOfWeek = require("date-fns/endOfWeek");
const addWeeks = require("date-fns/addWeeks");
const startOfMonth = require("date-fns/startOfMonth");
const addMonths = require("date-fns/addMonths");
const endOfMonth = require("date-fns/endOfMonth");
const startOfYear = require("date-fns/startOfYear");
const endOfYear = require("date-fns/endOfYear");
const addYears = require("date-fns/addYears");

const parseDate = require("./parse-date");

function dateFromChrono(components) {
  const implied = components.impliedValues;
  const known = components.knownValues;

  return new Date(
    ...[
      implied.year || known.year || 0,
      (implied.month || known.month || 1) - 1,
      implied.day || known.day || 0,
      implied.hour || known.hour || 0,
      implied.minute || known.minute || 0,
      implied.second || known.second || 0,
      implied.millisecond || known.millisecond || 0,
    ]
  );
}

module.exports = function (string, opts = {}) {
  const { now, pastTendency } = Object.assign(
    {
      now: new Date(),
      pastTendency: true,
    },
    opts
  );

  let start;
  let end;
  let unit;
  let modifier;

  const parsed = parseDate(string);
  if (parsed) {
    start = startOfDay(parsed);
    end = endOfDay(parsed);
    unit = "day";
    modifier = differenceInDays(start, now);
  } else {
    let parts = string.toLowerCase().split(/\s+/);

    if (["now", "today"].includes(parts[0])) {
      unit = "day";
      modifier = 0;
      start = startOfDay(now);
      end = endOfDay(now);
    }

    if (parts[0] === "yesterday") {
      unit = "day";
      modifier = -1;
      start = startOfDay(addDays(now, -1));
      end = endOfDay(addDays(now, -1));
    }

    if (parts[0] === "tomorrow") {
      unit = "day";
      modifier = 1;
      start = startOfDay(addDays(now, 1));
      end = endOfDay(start);
    }

    if (!start || !end) {
      let first = parts[0];
      unit = parts[1];
      if (first === "this") {
        modifier = 0;
      } else if (first === "last") {
        modifier = -1;
      } else if (first === "next") {
        modifier = 1;
      } else if (numbers.includes(first)) {
        modifier = numbers.indexOf(first);
        if (pastTendency) {
          modifier *= -1;
        }
      } else if (/^\d{4,}$/.test(first)) {
        modifier = pastTendency
          ? parseInt(first) - now.getFullYear()
          : now.getFullYear() - parseInt(first);
        unit = "year";
      } else if (parseInt(first)) {
        modifier = parseInt(first) || 0;
        if (pastTendency) {
          modifier *= -1;
        }
      } else {
        modifier = pastTendency ? -1 : 1;

        const chrono = require("chrono-node");
        const parsed = chrono.parse(string)[0];

        if (parsed) {
          if (parsed.start && parsed.end) {
            start = startOfDay(dateFromChrono(parsed.start));
            end = endOfDay(dateFromChrono(parsed.end));
          } else if (parsed.start && !parsed.end) {
            start = startOfDay(dateFromChrono(parsed.start));
            end = endOfDay(dateFromChrono(parsed.start));
          }

          const hours = differenceInHours(end, start);
          const days = hours / 24;
          const weeks = days / 7;
          const months = weeks / 4;

          if (~~months > 0) {
            unit = "month";
            modifier *= ~~months;
          } else if (~~days > 0) {
            unit = "week";
            modifier *= ~~weeks;
          } else {
            unit = "day";
            modifier *= ~~days;
          }
        }
      }

      // Singularize the unit.
      if (unit) {
        unit = unit.replace(/[s|ies]$/, "");
      }

      if ((!(modifier === 0 && parts[2] === "ago") && !start) || !end) {
        modifier = modifier || 0;

        if (unit === "day") {
          start = startOfDay(addDays(now, modifier));
          end = endOfDay(addDays(now, modifier));
        } else if (unit === "week") {
          start = startOfWeek(addWeeks(now, modifier));
          end = endOfWeek(addWeeks(now, modifier));
        } else if (unit === "month") {
          start = startOfMonth(addMonths(now, modifier));
          end = endOfMonth(addMonths(now, modifier));
        } else if (unit === "year") {
          start = startOfYear(addYears(now, modifier));
          end = endOfYear(addYears(now, modifier));
        } else if (/^\d+$/.test(unit)) {
          start = new Date(Number(unit));
          end = endOfYear(start);
          unit = "year";
        } else if (weekdays.includes(unit)) {
          let dayIndex = weekdays.indexOf(unit);
          let distance = 0;
          start = startOfDay(now);
          while (start.getDay() !== dayIndex) {
            start = addDays(start, modifier);
            distance += modifier;
          }
          end = endOfDay(start);
          unit = "day";
          modifier = distance;
        } else if (months.includes(unit)) {
          let monthIndex = months.indexOf(unit);
          let distance = 0;
          start = startOfMonth(now);
          while (start.getMonth() !== monthIndex) {
            start = addMonths(start, modifier);
            distance += modifier;
          }
          end = endOfMonth(start);
          unit = "month";
          modifier = distance;
        } else {
          console.log({ start, end, unit });
        }
      }
    }
  }

  return {
    start,
    end,
    unit: unit || "???",
    modifier: modifier || 0,
  };
};

const numbers = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
];

const months = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const weekdays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
