const fs = require('fs');
const path = require('path');

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

  function sessionsByProject() {

  }

  return {
    punchIn,
    punchOut,
    rewind,
    currentSession,
    lastSession,
    sessionsByProject,
  };
}