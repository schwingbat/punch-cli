const areSameDay = (one, two) => {
  return one.getFullYear() === two.getFullYear()
      && one.getMonth() === two.getMonth()
      && one.getDate() === two.getDate()
}

module.exports = function Reporter(config, flags) {
  const printDay = require('./log-day');
  const printWeek = require('./log-week');
  const printMonth = require('./log-month');
  const moment = require('moment')

  const sqlish = require('../files/sqlish')(config)

  return {
    forDay(today = new Date(), project) {
      const punches = sqlish
        .select()
        .from('punches')
        .where(p => {
          let match = true;
          if (project && p.project !== project) match = false;

          if (match) {
            if (p.out == null || areSameDay(p.in, today)) {
              return true
            }
          }

          return false
        })
        .run();
        
      printDay(config, punches, today, project);
    },
    forWeek(today = new Date(), project) {
      console.log('Weekly logs are not implemented yet.');
    },
    forMonth(today = new Date(), project) {
      const punches = sqlish.select()
        .where(p => {
          let match = true;
          if (project && p.project !== project) match = false;

          return p.in.getFullYear() === today.getFullYear()
              && p.in.getMonth() === today.getMonth()
              && match;
        })
        .run();

      printMonth(config, punches, today, project);
    },
    forYear(today = new Date(), project) {
      console.log('Yearly logs are not implemented yet.');
    }
  }

  function reportForMonth(today = new Date(), project) {
    const punches = [];
    const month = today.getMonth() + 1;
    const files = fs.readdirSync(punchPath).filter(file => {
      const [p, y, m, d] = file.split('_');
      return m == month; // double equals because m is a string.
    });

    if (files.length === 0) {
      return console.log(`No punches recorded for ${moment(today).format('MMMM YYYY')}.`);
    }

    files.forEach(file => {
      const f = Punchfile.read(path.join(punchPath, file));
      if (f) punches.push(...f.punches);
    });

    return monthReport(config, punches, today, project);
  }

  function reportForYear(today, project) {
    console.log('Yearly reports are not implemented yet.');
  }
}
