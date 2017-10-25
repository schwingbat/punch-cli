const fs = require('fs');
const path = require('path');

module.exports = function() {
  const home = require('os').homedir();
  let file;

  try {
    file = fs.readFileSync(path.join(home, '.punch.json'), 'utf8');
  } catch (err) {
    console.error(err);
    throw new Error('Missing config: No .punch.json file found in your home directory. Please create it and restart punch.');
  }

  try {
    file = JSON.parse(file);
  } catch (err) {
    throw new Error(err)
  }

  return file;
}