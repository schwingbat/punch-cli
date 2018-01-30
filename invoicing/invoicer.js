module.exports = function(config) {
  const durationfmt = require('../formatting/duration');
  const moment = require('moment');
  const chalk = require('chalk');
  const Loader = require('../utils/loader');

  function roundToMinute(ms) {
    return Math.ceil(ms / 1000 / 60) * 1000 * 60
  }

  function encomma(amount) {
    // Add commas at appropriate places for currency.

    let [whole, frac] = amount.split('.');

    if (whole.length > 3) {
      const chars = [];
      const rev = whole.split('').reverse();
      for (let i = 0; i < rev.length; i++) {
        chars.push(rev[i]);
        if (i !== 0 && (i + 1) % 3 === 0) {
          chars.push(',');
        }
      }
      return chars.reverse().join('') + '.' + frac;
    } else {
      return amount;
    }
  }

  const formats = {};
  formats.pdf = require('./pdf.js');
  formats.html = require('./html.js');

  return {
    async create(data, format) {
      if (!format) {
        return console.log(`No format specified for invoicer.create()`);
      } else if (!formats[format.toLowerCase()]) {
        return console.log(`Format ${format} not supported (yet?)`);
      }

      const loader = Loader({
        text: `Generating ${format} invoice...`,
        animation: 'braille'
      });

      loader.start();

      let totalTime = 0;
      let comments = [];

      const days = {};

      data.punches.forEach(punch => {
        const date = moment(punch.in);
        const time = punch.out - punch.in - punch.rewind;

        totalTime += time;

        const key = date.date();
        if (!days[key]) days[key] = {
          date: date.format('MM/DD/YYYY'),
          time: 0,
          comments: []
        };
        const d = days[key];
        d.time += time;

        if (punch.comment) {
          d.comments.push(punch.comment);
        } else if (punch.comments) {
          d.comments.push(...punch.comments.filter(c => c));
        }
      });

      let dayArray = [];

      for (const day in days) {
        const time = days[day].time;
        days[day].pay = '$' + encomma(((time / 3600000) * data.project.hourlyRate).toFixed(2));
        days[day].time = durationfmt(roundToMinute(time));
        dayArray.push(days[day]);
      }

      dayArray = dayArray.sort();

      let msToNearestMinute = roundToMinute(totalTime);
      let totalHours = totalTime / 3600000;
      let totalPay = totalHours * data.project.hourlyRate;

      let client;

      if (typeof data.project.client === 'string' && data.project.client[0] === '@') {
        client = config.clients[data.project.client.slice(1)];
      }

      const invoice = {
        start: data.startDate.format('MM/DD/YYYY'),
        end: data.endDate.format('MM/DD/YYYY'),
        today: moment().format('MM/DD/YYYY'),
        user: data.user,
        client,
        project: data.project,
        time: durationfmt(msToNearestMinute),
        days: dayArray,
        pay: '$' + encomma(totalPay.toFixed(2)),
        comments,
      };

      const result = await formats[format.toLowerCase()](invoice, data.output.path);

      loader.stop(chalk.green('✔️') + ` Done!`);

      return result;
    }
  }
}
