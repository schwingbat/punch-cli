function readAsJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch (err) {
    return false;
  }
}

module.exports = function(config) {
  const fs = require('fs');
  const path = require('path');
  const moment = require('moment');
  const datefmt = require('datefmt');
  const durationfmt = require('durationfmt');

  const { punchPath } = config;

  const Punchfile = require('./punchfile')(config);

  function getPunchFile(timestamp = Date.now(), create = true) {
    const date = new Date(timestamp);
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const y = date.getFullYear();

    let file = false;

    try {
      file = Punchfile.read(path.join(punchPath, `punch_${y}_${m}_${d}.json`));
    } catch (err) {
      if (create) {
        file = new Punchfile();
        file.save();
      }
    }

    return file;
  }

  function getLastFileWhere(func, timestamp) {
    // Returns the latest file where a passed-in function returns true.

    const date = moment(timestamp);

    let y, m, d;

    y = date.year();
    m = date.month() + 1;
    d = date.date();

    let file;
    let misses = 0;

    while (!file && misses <= 5) {
      let filename = `punch_${y}_${m}_${d}.json`;
      let filePath = path.join(punchPath, filename);
      try {
        file = Punchfile.read(filePath);
        if (func(file)) {
          return file;
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

  function getProjectSummaries(names) {
    const files = fs.readdirSync(punchPath).map(f => {
      const filePath = path.join(punchPath, f);
      try {
        return parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (err) {
        console.log(`Failed to read or parse file ${f}: ${err}`);
      }
    }).filter(f => f);

    const summarize = (project) => {
      const punches = [];
      let firstPunch;
      let latestPunch;
      let totalDays = 0;

      files.forEach(f => {
        let worked = false;

        f.punches.forEach(p => {
          if (p.project.toLowerCase() === project.toLowerCase()) {
            if (!firstPunch || p.in < firstPunch.in) {
              firstPunch = p;
            }
            if (!latestPunch || p.in > latestPunch.in) {
              latestPunch = p;
            }
            p.duration = (p.out || Date.now()) - p.in - (p.rewind || 0);
            punches.push(p);
            worked = true;
          }
        });

        if (worked) totalDays += 1;
      });

      const projectData = config.projects.find(p => p.alias === project);
      const fullName = projectData
        ? projectData.name
        : project;
      const totalTime = punches.reduce(
        (sum, punch) =>
          sum + ((punch.out || Date.now()) - punch.in - (punch.rewind || 0)),
        0);
      const totalHours = (totalTime / 3600000);
      const totalPay = projectData && projectData.hourlyRate
        ? totalHours * projectData.hourlyRate
        : 0;
      const hourlyRate = projectData && projectData.hourlyRate
        ? projectData.hourlyRate
        : 0;

      let longestPunch;
      let shortestPunch;

      punches.forEach(p => {
        if (!longestPunch || p.duration > longestPunch.duration) {
          longestPunch = p;
        }
        if (!shortestPunch || p.duration < shortestPunch.duration) {
          shortestPunch = p;
        }
      });


      return {
        fullName,
        totalTime,
        totalHours,
        totalPay,
        hourlyRate,
        firstPunch,
        latestPunch,
        shortestPunch,
        longestPunch,
        totalPunches: punches.length,
        totalDays
      };
    };

    if (names) {
      return names.map(n => summarize(n));
    } else {
      return config.projects.map(p => summarize(p.alias));
    }
  }

  return {
    purgeProject,
    getPunchesForPeriod,
    getProjectSummaries,
  };
}
