/**
 * Given a config file, find the references to clients and link the full objects.
 */

module.exports = function(config) {
  const { projects, clients } = config;

  let errors = [];

  const aliases = Object.keys(projects);
  for (const alias of aliases) {
    const project = projects[alias];

    // Add a reference to the project's alias.
    project.alias = alias;

    let clientName = project.client;

    if (typeof clientName !== "string") {
      continue;
    }

    if (clientName[0] === "@") {
      clientName = clientName.slice(1);
    }

    const client = clients[clientName];

    if (!client) {
      errors.push(
        `Project '${
          project.name
        }' references '${clientName}', but no client with that name exists.`
      );
    } else {
      project.client = client;
    }
  }

  return errors;
};
