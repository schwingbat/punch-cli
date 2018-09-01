module.exports = function MockStorageService (config, Punch) {
  return {
    // Saves a single punch object
    async save (punch) {},

    // Returns the currently running punch (or null)
    // Optionally filters by project
    async current (project) {},

    // Returns the most recent punch
    // Optionally filters by project
    async latest (project) {},

    // Returns an array of punches for which the passed
    // function returns true. Like 'filter'
    async select (fn) {},

    // Called before the program exits.
    // Close connections and do any necessary cleanup.
    async cleanUp () {}
  }
}
