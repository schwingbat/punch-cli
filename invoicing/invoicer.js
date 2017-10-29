const durationfmt = require('../formatting/duration');

module.exports = function(config) {
  const formats = {};
  formats.pdf = require('./pdf.js');

  return {
    create(data, format) {
      if (!format) {
        return console.log(`No format specified for invoicer.create()`);
      } else if (!formats[format.toLowerCase()]) {
        return console.log(`Format ${format} not supported (yet?)`);
      }

      let totalTime = 0;
      let comments = [];

      data.punches.forEach(punch => {
        totalTime += punch.out - punch.in - punch.rewind;
        if (punch.comment) {
          comments.push(punch.comment);
        }
      });

      let msToNearestMinute = Math.ceil(totalTime / 1000 / 60) * 1000 * 60;
      let totalHours = msToNearestMinute / 3600000;
      let totalPay = totalHours * data.project.hourlyRate;

      const invoice = {
        start: data.startDate.format('MMMM Do, YYYY'),
        end: data.endDate.format('MMMM Do, YYYY'),
        contractor: data.user,
        client: data.project.client,
        time: durationfmt(msToNearestMinute),
        pay: '$' + totalPay.toFixed(2),
        comments,
      };

      return formats[format.toLowerCase()](invoice, data.output.path);
    }
  }
}