module.exports = function (p, root) {
  const path = require('path')
  const os = require('os')

  // Resolve ~ paths
  if (p[0] === '~') {
    // ~/path -> /home/user/path
    return path.join(os.homedir(), p.slice(1))
  } else {
    if (root) {
      return path.resolve(root, p)
    } else {
      return path.resolve(p)
    }
  }
}
