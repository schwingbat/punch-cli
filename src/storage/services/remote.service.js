/**
 * Uses a remote Punch instance as a storage backend.
 */

module.exports = function (config, Punch) {
  return {
    name: "remote",

    // Saves a single punch object
    async save(punch) {},

    // Returns the currently running punch (or null)
    // Optionally filters by project
    async current(project) {},

    // Returns the most recent punch
    // Optionally filters by project
    async latest(project) {},

    // Returns an array of punches for which the passed
    // function returns true.
    async filter(fn) {},

    // Returns the first punch for which the passed
    // function returns true.
    async find(fn) {},

    // Deletes a given punch
    async delete(punch) {},

    // Commits any pending changes
    async commit() {},

    // Called before the program exits.
    // Close connections and do any necessary cleanup.
    async cleanUp() {},
  };
};
