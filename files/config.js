const fs = require('fs-extra');
const path = require('path');

module.exports = function(options = {}) {
  const home = require('os').homedir();
  const punchDir = options.punchDir || path.join(require('os').homedir(), '.punch');
  let file;

  try {
    file = fs.readFileSync(path.join(punchDir, 'punchconfig.json'), 'utf8');
  } catch (err) {
    try {
      fs.ensureDirSync(punchPath);
      fs.writeFileSync(path.join(punchDir, 'punchconfig.json'), JSON.stringify({
        user: {
          name: 'Your Name',
          address: {
            street: '123 1st Street',
            city: 'Anytown',
            state: 'WA',
            zip: '12345'
          }
        },
        sync: {
          autoSync: false,
          backends: {}
        },
        projects: []
      }, null, 2));
    } catch (err) {
      throw new Error(`Error creating punchconfig: ${err.message}`);
    }
  }

  try {
    file = JSON.parse(file);
  } catch (err) {
    throw new Error(err)
  }

  file.configPath = path.join(punchDir, 'punchconfig.json');
  file.trackerPath = path.join(punchDir, 'tracker.json');
  file.punchPath = path.join(punchDir, 'punches');

  if (options.overrides) {
    const o = options.overrides;

    if (o.configPath) file.configPath = o.configPath;
    if (o.trackerPath) file.trackerPath = o.trackerPath;
    if (o.punchPath) file.punchPath = o.punchPath;
  }

  return file;
}