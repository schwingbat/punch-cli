const durationfmt = require('../formatting/duration');
const moment = require('moment');
const chalk = require('chalk');
const Loader = require('../utils/loader');

function roundToMinute(ms) {
  return Math.ceil(ms / 1000 / 60) * 1000 * 60
}

module.exports = function(config) {
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
        }
      });

      let dayArray = [];

      for (const day in days) {
        const time = roundToMinute(days[day].time);
        days[day].pay = '$' + ((time / 3600000) * data.project.hourlyRate).toFixed(2);
        days[day].time = durationfmt(time);
        dayArray.push(days[day]);
      }

      dayArray = dayArray.sort();

      let msToNearestMinute = roundToMinute(totalTime);
      let totalHours = msToNearestMinute / 3600000;
      let totalPay = totalHours * data.project.hourlyRate;

      const invoice = {
        start: data.startDate.format('MM/DD/YYYY'),
        end: data.endDate.format('MM/DD/YYYY'),
        today: moment().format('MM/DD/YYYY'),
        user: data.user,
        client: data.project.client,
        project: data.project,
        time: durationfmt(msToNearestMinute),
        days: dayArray,
        pay: '$' + totalPay.toFixed(2),
        comments,
      };

      const result = await formats[format.toLowerCase()](invoice, data.output.path);

      loader.stop(chalk.green('✔️') + ` Done!`);

      return result;
    }
  }
}
