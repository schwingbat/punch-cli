/**
 * Dereferences any '@client'-style references in projects. This allows multiple projects to share references
 * to the same client without copying and pasting an object multiple times in the config file.
 *
 * @param {object} config - The app config.
 */
module.exports = function(config) {
  const { projects, clients } = config;

  let _errors = [];
  let _projects = {};

  for (const alias in projects) {
    const project = {
      ...projects[alias]
    };

    /**
     * Add the project's alias to the project object itself. This helps to identify the project
     * when the project object is being passed around without the context of the main config object
     * in which it's referenced.
     */
    project.alias = alias;

    let clientName = project.client;

    /**
     * If the client field is a string, assume it's a reference to a key in the clients object.
     */
    if (typeof clientName === "string") {
      /**
       * The '@' at the beginning helps to denote that it's a reference to a client for human readers.
       * We'll remove this character if present to get the actual key for lookup.
       */
      if (clientName[0] === "@") {
        clientName = clientName.slice(1);
      }

      const client = {
        name: clientName,
        ...clients[clientName]
      };

      if (client) {
        project.client = client;
      } else {
        _errors.push(
          `Project '${project.name}' references '${clientName}', but no client with that name exists.`
        );
      }
    }

    _projects[alias] = project;
  }

  return {
    errors: _errors,
    projects: _projects
  };
};
