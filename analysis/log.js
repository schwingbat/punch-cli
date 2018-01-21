const printDay = require('./log-day');
const printWeek = require('./log-week');
const printMonth = require('./log-month');

module.exports = function Reporter(config, flags) {
  const sqlish = require('../files/sqlish')(config);

  return {
    forDay(date = new Date(), project) {
      const punches = sqlish.select()
        .where(p => {
          let match = true;
          if (project && p.project !== project) match = false;

          return p.in.getFullYear() === date.getFullYear()
              && p.in.getMonth() === date.getMonth()
              && p.in.getDate() === date.getDate()
              && match;
        })
        .run();

      printDay(config, punches, date, project);
    },
    forWeek(date = new Date(), project) {
      console.log('Weekly logs are not implemented yet.');
    },
    forMonth(date = new Date(), project) {
      const punches = sqlish.select()
        .where(p => {
          let match = true;
          if (project && p.project !== project) match = false;

          return p.in.getFullYear() === date.getFullYear()
              && p.in.getMonth() === date.getMonth()
              && match;
        })
        .run();

      printMonth(config, punches, date, project);
    },
    forYear(date = new Date(), project) {
      console.log('Yearly logs are not implemented yet.');
    }
  }

  function reportForMonth(date = new Date(), project) {
    const punches = [];
    const month = date.getMonth() + 1;
    const files = fs.readdirSync(punchPath).filter(file => {
      const [p, y, m, d] = file.split('_');
      return m == month; // double equals because m is a string.
    });

    if (files.length === 0) {
      return console.log(`No punches recorded for ${moment(date).format('MMMM YYYY')}.`);
    }

    files.forEach(file => {
      const f = Punchfile.read(path.join(punchPath, file));
      if (f) punches.push(...f.punches);
    });

    return monthReport(config, punches, date, project);
  }

  function reportForYear(date, project) {
    console.log('Yearly reports are not implemented yet.');
  }
}
