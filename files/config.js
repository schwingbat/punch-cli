module.exports = function(options = {}, flags = {}) {
  const fs = require('fs');
  const path = require('path');

  let startedAt = Date.now();

  let punchDir;
  if (options && options.punchDir) {
    punchDir = options.punchDir
  } else {
    punchDir = path.join(require('os').homedir(), '.punch');
  }

  let file;

  try {
    file = JSON.parse(fs.readFileSync(path.join(punchDir, 'punchconfig.json'), 'utf8'));

    // Map projects to an array
    const projects = [];
    for (const p in file.projects) {
      file.projects[p].alias = p;
      projects.push(file.projects[p]);
    }
    file.projects = projects;

    // Check validity of @client references
    file.projects.forEach(project => {
      if (typeof project.client === 'string' && project.client[0] === '@') {
        if (!file.clients[project.client.slice(1)]) {
          throw new Error(`Project '${project.name}' has a reference to a client object that doesn't exist in the 'clients' list (${project.client})`);
        }
      }
    });

  } catch (err) {
    console.error(err);
    throw new Error('No readable config file: create a punchconfig.json file in your punch directory and try again.');
  }

  file.configPath = path.join(punchDir, 'punchconfig.json');
  file.trackerPath = path.join(punchDir, 'tracker.json');
  file.punchPath = path.join(punchDir, 'punches');

  if (options && options.overrides) {
    const o = options.overrides;

    if (o.configPath) file.configPath = o.configPath;
    if (o.trackerPath) file.trackerPath = o.trackerPath;
    if (o.punchPath) file.punchPath = o.punchPath;
  }

  if (flags.BENCHMARK) {
    console.log(`Loaded config file in ${Date.now() - startedAt}ms`);
  }

  return file;
}
