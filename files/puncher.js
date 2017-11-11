const fs = require('fs');
const path = require('path');
const moment = require('moment');
const datefmt = require('../formatting/time');
const durationfmt = require('../formatting/duration');
const dayReport = require('../analysis/dayreport');
const monthReport = require('../analysis/monthreport');

function readAsJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch (err) {
    return false;
  }
}

module.exports = function(config) {
  const punchPath = path.join(require('os').homedir(), '.punch', 'punches');

  function getPunchFile(timestamp = Date.now(), create = false) {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();

    const filePath = path.join(punchPath, `punch_${year}_${month}_${day}.json`);
    let exists = fs.existsSync(filePath);
    let created;

    if (!exists && create) {
      created = {
        updated: Date.now(),
        punches: []
      };

      fs.writeFileSync(filePath, JSON.stringify(created, null, 2));
      exists = true;
    }

    let contents;

    if (exists) {
      try {
        contents = created || JSON.parse(fs.readFileSync(filePath));
      } catch (err) {
        console.log(`Problem reading punchfile: ${err}`);
      }
    }

    return {
      path: filePath,
      exists,
      contents,
    };
  }

  function getLastFileWhere(func, timestamp) {
    const date = moment(timestamp);
    
    let y, m, d;
    
    y = date.year();
    m = date.month() + 1;
    d = date.date();

    let file;
    let misses = 0;

    while (!file && misses <= 5) {
      let filename = `punch_${y}_${m}_${d}.json`;
      try {
        file = JSON.parse(fs.readFileSync(path.join(punchPath, filename)));
        if (func(file)) {
          return {
            path: path.join(punchPath, filename),
            exists: true,
            contents: file
          };
        }
        return false;

      } catch (err) {
        misses += 1;
        date.set('date', date.date() - 1);
        y = date.year();
        m = date.month() + 1;
        d = date.date();
      }
    }

    return false;
  }

  function savePunchFile(file) {
    fs.writeFileSync(file.path, JSON.stringify(file.contents, null, 2));
  }

  function createPunch(project, timeIn, timeOut, comment) {
    const now = Date.now();
    const file = getPunchFile(timeIn, true);

    const p = {
      project,
      in: timeIn,
      out: timeOut || null,
      comment: comment || null,
      rewind: 0,
    }

    file.contents.updated = now;
    file.contents.punches.push(p);

    savePunchFile(file);
  }

  function punchIn(project, now = Date.now()) {
    createPunch(project, now);
  }

  function punchOut(comment, now = Date.now()) {
    const file = getLastFileWhere(f =>
      f.punches.find(p => p.out == null),
      now);

    if (!file) {
      return console.warn('Nothing to punch out from!');
    }

    const { punches } = file.contents;
    const lastPunch = punches[punches.length - 1];

    file.contents.updated = now;
    lastPunch.out = now;
    lastPunch.comment = comment || null;

    savePunchFile(file);
    // console.log(JSON.stringify(file.contents.punches, null, 2));
  }

  function rewind(fuzzyStr) {

  }

  function purgeProject(alias, dryRun = true) {
    let found = 0;
    let time = 0;
    let days = 0;

    fs.readdirSync(punchPath).forEach(file => {
      const fullPath = path.join(punchPath, file);

      try {
        const f = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

        let foundOne = false;

        f.punches = f.punches.filter(p => {
          if (p.project === alias) {
            found += 1;
            time += (p.out || Date.now()) - p.in - (p.rewind || 0);
            foundOne = true;
            return false;
          } else {
            return true;
          }
        });

        if (foundOne) days += 1;

        if (!dryRun) {
          fs.writeFileSync(fullPath, JSON.stringify(f));
        }

      } catch (err) {
        console.log(`Failed to read ${file}: ${err}`);
      }
    });

    return { found, time, days };
  }

  function getPunchesForPeriod(start, end) {
    const files = fs.readdirSync(punchPath).filter(f => {
      let [p, y, m, d] = f.split('_').map(n => parseInt(n));
      const readDate = new Date(y, m - 1, d);
      return readDate >= start && readDate <= end;
    });

    const punches = [];

    files.forEach(f => {
      punches.push(...JSON.parse(fs.readFileSync(path.resolve(punchPath, f))).punches);
    });

    return punches;
  }

  function currentSession() {
    const file = getLastFileWhere(f => {
      for (let i = 0; i < f.punches.length; i++) {
        if (f.punches[i].out == null) {
          return true;
        }
      }
    });

    if (file) {
      for (let i = 0; i < file.contents.punches.length; i++) {
        if (file.contents.punches[i].out == null) {
          return file.contents.punches[i];
        }
      }
    }
  }

  /*=======================*\
  ||       Reporting       ||
  \*=======================*/

  function reportForDay(date = new Date(), project) {
    const file = getPunchFile(date);

    return dayReport(config, file && file.contents ? file.contents.punches : [], date, project);
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
      const f = readAsJSON(path.join(punchPath, file));
      if (f) punches.push(...f.punches);
    });

    return monthReport(config, punches, date, project);
  }

  function reportForYear(date, project) {
    console.log('Yearly reports are not implemented yet.');
  }

  return {
    createPunch,
    punchIn,
    punchOut,
    rewind,
    purgeProject,
    getPunchesForPeriod,
    currentSession,
    reportForDay,
    reportForMonth,
    reportForYear,
  };
}