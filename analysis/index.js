const fs = require('fs');
const datefmt = require('../formatting/time');
const durationfmt = require('../formatting/duration');

module.exports = function(config) {
  const rewindStringToMS = str => {
    const parts = str.split(' ').trim();
  
    console.log(str);
    return 1000;
  }
  
  const processLines = lines =>
    lines.filter(line => line != '').map(line => line.split('\t'));
  
  const processSession = (project, start, end, rewinds) => {
    const projectData = config.projects.find(p => p.alias === project);
    let length = end - start;

    console.log({ start, end });
  
    // if (rewinds && rewinds.length > 0) {
    //   length -= rewinds
    //     .map(re => rewindStringToMS(re[1]))
    //     .reduce((prev, current) => prev + current);
    // }
  
    let pay = 0;
    if (projectData && projectData.hourlyRate) {
      pay = projectData.hourlyRate * (length / 1000 / 60 / 60);
    }
  
    // console.log(length);
    const proj = config.projects.find(p => p.alias === project);
    const session = {
      project: proj && proj.name ? proj.name : project,
      start: datefmt.dateTime(start),
      end: datefmt.dateTime(end),
      time: durationfmt(length),
      pay: '$' + pay.toFixed(2),
    }

    console.log(JSON.stringify(session, null, 2));
    return session;
  };
  
  return {
    sessionsByProject(filepath, project) {
      const file = fs.readFileSync(filepath, 'utf8');
      const lines = processLines(file.split('\n'));
      const sessions = [];
      let start;
      let rewinds = [];
    
      lines.forEach(line => {
        switch (line[0]) {
        case 'in':
          start = line;
          break;
        case 'out':
          console.log({ start, line });
          sessions.push(processSession(start[2], ~~start[1], ~~line[1], rewinds));
          start = null;
          rewinds = [];
          break;
        case 'rewind':
          rewinds.push(line);
          break;
        case 'session':
          // session	2017-17-25T02:59:29.073Z	2017-17-25T04:32:12.569Z	bidpro	Designed login screen
          break;
        }
      });

      return sessions;
    }
  };
}