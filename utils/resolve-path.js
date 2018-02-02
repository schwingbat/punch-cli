module.exports = function(p) {
  const path = require('path');
  const os = require('os');

  // Resolve ~ paths
  if (p[0] === '~') {
    // ~/path -> /home/user/path
    path.join(os.homedir(), p.slice(1));
  } else {
    return path.resolve(p);
  }
}