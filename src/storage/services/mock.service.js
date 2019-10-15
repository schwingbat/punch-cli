module.exports = function(config, Punch) {
  return {
    name: "mock",

    /**
     * Persists a single punch object.
     *
     * @param punch - Punch object to save.
     */
    async save(punch) {},

    /**
     * Returns the currently running punch (or null). Optionally filters by project.
     *
     * @param project - (string, optional) project alias to filter by.
     */
    async current(project) {},

    // Returns the most recent punch
    // Optionally filters by project
    async latest(project) {},

    // Returns an array of punches for which the passed
    // function returns true. Like 'filter'
    async select(fn) {
      return punches.filter(p => !p.deleted && fn(p));
    },

    // Deletes a given punch
    async delete(punch) {},

    // Called before the program exits.
    // Close connections and do any necessary cleanup.
    async cleanUp() {}
  };
};
