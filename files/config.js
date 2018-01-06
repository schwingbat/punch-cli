const fs = require('fs-extra');
const path = require('path');

module.exports = function() {
  const home = require('os').homedir();
  const punchPath = path.join(require('os').homedir(), '.punch');
  let file;

  try {
    file = fs.readFileSync(path.join(punchPath, 'punchconfig.json'), 'utf8');
  } catch (err) {
    try {
      fs.ensureDirSync(punchPath);
      fs.writeFileSync(path.join(punchPath, 'punchconfig.json'), JSON.stringify({
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

  file.configPath = path.join(home, '.punch', 'punchconfig.json');
  file.trackerPath = path.join(home, '.punch', 'tracker.json');
  file.punchPath = path.join(home, '.punch', 'punches');

  return file;
}