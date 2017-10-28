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

  function getLastPunchFile(now) {
    const files = fs.readdirSync(punchPath).sort();
    let file;
    let filePath;

    for (let i = files.length - 1; i >= 0; i--) {
      try {
        filePath = path.join(punchPath, files[i]);
        file = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (err) {
        console.error('Failed to read punchfile: ' + files[i]);
      }

      return {
        path: filePath,
        exists: true,
        contents: file,
      };
    }
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
    const file = getLastPunchFile(now);

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
    const file = getLastPunchFile(Date.now());
    if (file) {
      const { punches } = file.contents;
      if (punches[punches.length - 1].out == null) {
        return punches[punches.length - 1];
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  function lastSession() {

  }

  /*=======================*\
  ||       Reporting       ||
  \*=======================*/

  function reportForDay(date = new Date(), project) {
    const file = getPunchFile(date);

    if (!file.exists) {
      return console.log(`No sessions for ${datefmt.date(date)}.`);
    }

    return dayReport(config, file.contents.punches, date, project);
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

  }

  return {
    createPunch,
    punchIn,
    punchOut,
    rewind,
    getPunchesForPeriod,
    currentSession,
    lastSession,
    reportForDay,
    reportForMonth,
    reportForYear,
  };
}