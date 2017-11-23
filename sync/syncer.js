const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const logUpdate = require('log-update');
const Loader = require('../utils/loader');
const { write } = process.stdout;

module.exports = function(config, flags) {
  const { VERBOSE } = flags;
  const backends = {};

  const { punchPath, configPath } = config;

  for (const name in config.sync.backends) {
    const modulePath = path.join(__dirname, `${name}.backend.js`);

    if (fs.existsSync(modulePath)) {
      backends[name] = require(modulePath)(config.sync.backends[name], flags);
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

      // Check for files in sync manifest.
      for (const file in manifest) {
        try {
          const f = JSON.parse(fs.readFileSync(path.join(punchPath, file), 'utf8'));

          if (!manifest[file] || f.updated > manifest[file]) {
            uploads.push(file)
          } else if (f.updated < manifest[file]) {
            downloads.push(file);
          }
        } catch (err) {
          downloads.push(file);
        }

        done += 1;
        if (done === total) {
          // Check for files locally (not in manifest)
          fs.readdirSync(punchPath).forEach(file => {
            if (!manifest[file]) {
              uploads.push(file);
            }
          });
          if (VERBOSE) console.log(`Finished diffing ${total} files.`);
          return resolve({ uploads, downloads, manifest });
        }
      }
    });
  }

  async function writeFiles(results) {
    if (results.downloaded) {
      let count = 0;
      for (const name in results.downloaded) {
        const d = results.downloaded[name];
        fs.writeFileSync(path.join(config.punchPath, name), JSON.stringify(d, null, 2));
      }
      if (VERBOSE && count > 0) console.log(`Wrote ${count} downloaded files.`);
    }
    return results;
  }

  async function readFiles(results) {
    if (VERBOSE && results.uploads.length > 0) console.log(`Reading contents of files to be uploaded.`);

    let count = 0;
    const uploadable = {};
    results.uploads.forEach(u => {
      count += 1;
      uploadable[u] = JSON.parse(fs.readFileSync(path.join(punchPath, u), 'utf8'));
    });
    results.uploadable = uploadable;

    if (VERBOSE && count > 0) {
      console.log(`Read contents of ${count} files.`);
    }

    return results;
  }

  async function updateStamps(results) {
    const { uploads, postManifest } = results;

    if (uploads.length > 0) {
      if (VERBOSE) console.log('Updating timestamps on uploaded files...');
      uploads.forEach(file => {
        if (postManifest[file]) {
          try {
            const p = path.join(punchPath, file)
            const f = JSON.parse(fs.readFileSync(p, 'utf8'));
            f.updated = postManifest[file];
            fs.writeFileSync(p, JSON.stringify(f, null, 2));
          } catch (err) {
            console.error(`There was a problem updating the timestamp on ${file}: ${err}`);
          }
        }
      });
    }

    return results;
  }

  return {
    sync() {
      const syncers = [];
      const start = Date.now();

      const loader = new Loader({
        text: 'Syncing...',
        animation: 'braille',
      });

      loader.start();

      for (const name in backends) {
        backends[name]
          .getManifest()
          .then(diff)
          .then(readFiles)
          .then(backends[name].upload)
          .then(backends[name].download)
          .then(writeFiles)
          .then(updateStamps)
          .then(r => {
            const count = r.downloads.length + r.uploads.length;
            if (VERBOSE) {
              console.log(` Synced ${count} file${count === 1 ? '' : 's'} in ${Date.now() - start}ms.`);
            }
            loader.stop(chalk.green('✔️') + ' Synced!');
          });
      }

      return Promise.all(syncers);
    }
  }
}