const fs = require('fs');
const path = require('path');
const datefmt = require('../formatting/time');
const durationfmt = require('../formatting/duration');

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

  function getLastPunchFile() {
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

  function punchIn(project) {
    const now = Date.now();
    const file = getPunchFile(now, true);

    file.contents.updated = now;
    file.contents.punches.push({
      project,
      in: now,
      out: null,
      comment: null,
      rewind: 0,
    });

    savePunchFile(file);
    // console.log(JSON.stringify(file.contents, null, 2));
  }

  function punchOut(comment) {
    const file = getLastPunchFile();
    const now = Date.now();

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

  function currentSession() {
    const file = getLastPunchFile();
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

  function reportForSession(session) {

  }

  function reportForDay(date = new Date(), project) {
    const file = getPunchFile(date);

    if (!file.exists) {
      return console.log(`No sessions for ${datefmt.date(date)}.`);
    }

    let projects = {};
    file.contents.punches.forEach(punch => {
      if (project && punch.project !== project) return;

      if (!projects[punch.project]) projects[punch.project] = {
        name: punch.project,
        time: 0,
        rewind: 0,
        sessions: [],
      }

      let end = punch.out || Date.now();

      projects[punch.project].time += end - punch.in;
      projects[punch.project].sessions.push({
        start: datefmt.dateTime(punch.in),
        end: punch.out ? datefmt.dateTime(punch.out) : "Now",
        time: end - punch.in,
        comment: punch.comment,
        duration: durationfmt(end - punch.in),
      });
    });

    let dayTime = 0;
    let dayPay = 0;
    for (const name in projects) {
      const proj = config.projects.find(p => p.alias === name);
      dayTime += projects[name].time;
      if (proj && proj.hourlyRate) {
        dayPay += projects[name].time / 1000 / 60 / 60 * proj.hourlyRate;
      }
    }

    console.log(`\nWORK FOR ${datefmt.date(date)} (${durationfmt(dayTime)} / \$${dayPay.toFixed(2)})`);

    for (const name in projects) {
      const proj = config.projects.find(p => p.alias === name);

      const time = durationfmt(projects[name].time - projects[name].rewind);
      let pay;
      if (proj && proj.hourlyRate) {
        pay = '$' + (projects[name].time / 1000 / 60 / 60 * proj.hourlyRate).toFixed(2);
      }

      console.log();
      console.log(`${proj ? proj.name : name} (${time}${pay ? ' / ' + pay : ''})`);
      projects[name].sessions.forEach(session => {
        const span = session.start.split(' ').pop() + ' - ' + session.end.split(' ').pop();
        let sessionPay;
        if (proj && proj.hourlyRate) {
          sessionPay = '$' + (session.time / 1000 / 60 / 60 * proj.hourlyRate).toFixed(2);
        }
        console.log(`  ${span} (${session.duration}${sessionPay ? ' / ' + sessionPay : ''}) ${session.comment ? ' => "' + session.comment + '"' : ''}`);
      });
    }
  }

  function reportForMonth(date, project) {

  }

  function reportForYear(date, project) {

  }

  return {
    punchIn,
    punchOut,
    rewind,
    currentSession,
    lastSession,
    reportForSession,
    reportForDay,
    reportForMonth,
    reportForYear,
  };
}