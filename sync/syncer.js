const fs = require('fs');
const path = require('path');

module.exports = function(config) {
  const backends = {};

  const { punchPath, configPath } = config;

  for (const name in config.sync.backends) {
    const modulePath = path.join(__dirname, `${name}.backend.js`);

    if (fs.existsSync(modulePath)) {
      backends[name] = require(modulePath)(config.sync.backends[name]);
    } else {
      console.log(`Config specifies a "${name}" backend config, but Punch doesn't have a module for it.`);
    }
  }

  function diff(manifest) {
    return new Promise((resolve, reject) => {
      const uploads = [];
      const downloads = [];
      let total = 0;
      let done = 0;

      for (const file in manifest) {
        total += 1;
      }

      for (const file in manifest) {
        try {
          const f = JSON.parse(fs.readFileSync(path.join(punchPath, file), 'utf8'));

          if (f.updated > manifest[file]) {
            uploads.push(file)
          } else if (f.updated < manifest[file]) {
            downloads.push(file);
          }
        } catch (err) {
          downloads.push(file);
        }

        done += 1;
        if (done === total) {
          return resolve({ uploads, downloads, manifest });
        }
      }
    });
  }

  function writeFiles(results) {
    return new Promise((resolve, reject) => {
      if (results.downloaded) {
        for (const name in results.downloaded) {
          const d = results.downloaded[name];
          fs.writeFileSync(path.join(config.punchPath, name), JSON.stringify(d, null, 2));
        }
      }
      return resolve(results);
    });
  }

  function readFiles(results) {
    return new Promise((resolve, reject) => {
      const uploadable = {};
      results.uploads.forEach(u => {
        uploadable[u] = JSON.parse(fs.readFileSync(path.join(punchPath, u), 'utf8'));
      });
      results.uploadable = uploadable;
      return resolve(results);
    });
  }

  return {
    sync() {
      const syncers = [];
      const start = Date.now();

      for (const name in backends) {
        backends[name]
          .getManifest()
          .then(diff)
          .then(readFiles)
          .then(backends[name].upload)
          .then(backends[name].download)
          .then(writeFiles)
          .then(r => {
            const count = r.downloads.length + r.uploads.length;
            console.log(`Synced ${count} file${count === 1 ? '' : 's'} in ${Date.now() - start}ms.`);
          });
      }

      return Promise.all(syncers);
    }
  }
}