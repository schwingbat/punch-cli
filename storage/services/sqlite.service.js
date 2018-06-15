module.exports = function (config, Punch) {
  const path = require('path')
  const sqlite = require('sqlite3')
  const dbPath = path.join(config.configPath, 'punch.db')
  const db = new sqlite.Database(dbPath)

  return {
    async save (punch) {
      
    },

    async current (project) {

    },

    async latest (project) {

    },

    async select (fn) {

    }
  }
}
