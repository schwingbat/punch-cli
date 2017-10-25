const fs = require('fs');
const path = require('path');

module.exports = function(config) {
  const { sessionsByProject } = require('../analysis')(config);
  const { punchfile } = config.paths;

  if (!fs.existsSync(punchfile)) {
    fs.writeFileSync(punchfile, '');
  }

  function appendLine(line) {
    // Add newline if one doesn't exist and append.
    fs.appendFileSync(punchfile, line.trim() + '\n');
  }

  return {
    punchIn(project) {
      appendLine(['in', Date.now(), project || ''].join('\t'));
    },
    punchOut(description) {
      appendLine(['out', Date.now(), project || ''].join('\t'));
    },
    rewind(milliseconds, project) {
      appendLine(['rewind', milliseconds, project].join('\t'));
    },
    isPunchedIn() {
      return true;
    },
    currentSession() {
      return {
        alias: 'bidpro',
      }
    },
    sessionsByProject: sessionsByProject.bind(null, punchfile),
  };
}