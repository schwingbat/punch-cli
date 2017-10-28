const path = require('path');
const os = require('os');

module.exports = p => path.resolve(p.replace(/^~/, os.homedir()));