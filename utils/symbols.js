// The source of all symbols used in the program.

module.exports = function (config) {
  const simple = config.display.unicode === false
              || process.argv.includes('--no-unicode')
              || require('os').platform() === 'win32'
                 && config.display.windowsUnicode !== true

  const sym = {
    syncUpload: '↗',
    syncDownload: '↘',
    syncSuccess: '✔',
    syncFail: '❌',
    warning: '⚠',
    logSessionBullet: '⸭'
  }

  if (simple) {
    sym.syncUpload = '^'
    sym.syncDownload = 'v'
    sym.syncSuccess = ':)'
    sym.syncFail = ':('
    sym.warning = '!!',
    sym.logSessionBullet = '>'
  }
  
  return sym
}