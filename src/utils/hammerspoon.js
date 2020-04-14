const path = require("path");
const fs = require("fs");

module.exports = async function(config, Punch) {
  const active = await Punch.filter(p => !p.deleted && p.out == null);
  
  let writtenAt = ~~(new Date().getTime() / 1000)
  let initialTime = 0;
  let initialMoney = 0;
  let hourlyRate = 0;
  
  active.sort((a, b) => {
    if (a["in"] < b["in"]) {
      return -1;
    } else if (a["in"] > b["in"]) {
      return +1;
    } else {
      return 0;
    }
  });
  
  if (active.length > 0) {
    initialTime = ~~(active[0].duration() / 1000);
  }
  
  const json = {
    working: active.length > 0,
    writtenAt,
    initialTime,
    initialMoney,
    hourlyRate,
    projects: active.map(punch => config.projects[punch.project].name)
  };
  
  const outPath = path.join(config.punchPath, "hammerspoon.json");
  fs.writeFileSync(outPath, JSON.stringify(json, null, 2));
}