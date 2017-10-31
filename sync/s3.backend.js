// Sync with Amazon S3

const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

module.exports = function(config) {
  if (!config) throw new Error('S3 sync module was not initialized with a config file.');
  if (!config.credentials) throw new Error('S3 sync config doesn\'t include a credentials key.');
  if (typeof config.credentials !== 'string') throw new Error('S3 sync config credentials is not a string. Must be a path to a JSON file containing your key and secret.');

  let credentials;
  let credPath;

  if (config.credentials[0] === '~') {
    credPath = path.join(require('os').homedir(), config.credentials.slice(1));
  } else {
    credPath = path.resolve(config.credentials);
  }

  if (fs.existsSync(credPath)) {
    try {
      credentials = JSON.parse(fs.readFileSync(credPath));
    } catch (err) {
      throw new Error('There was a problem reading the S3 credentials file: ' + err);
    }
  } else {
    throw new Error('S3 sync credentials was a string, but is an invalid path. File does not exist.');
  }

  const s3 = new AWS.S3({ credentials });

  return {
    getManifest() {
      console.log('Syncing with Amazon S3 bucket...');

      return new Promise((resolve, reject) => {
        s3.headBucket({ Bucket: config.bucket }, (err, data) => {
          if (err) return reject(err);
          s3.listObjectsV2({ Bucket: config.bucket }, (err, data) => {
            if (err) return reject(err);
            const manifest = {};

            data.Contents.forEach(p => {
              const name = p.Key.replace(/^punches\//, '');
              const timestamp = new Date(p.LastModified).getTime();
              
              manifest[name] = timestamp;
            });

            return resolve(manifest);
          });
        });
      });
    },
    upload(results) {
      return new Promise((resolve, reject) => {
        if (results.uploads.length === 0) {
          results.uploaded = [];
          console.log('Nothing to upload.');
          return resolve(results);
        }
        const { length } = results.uploadable;
        let done = 0;

        for (const file in results.uploadable) {
          const params = {
            Bucket: config.bucket,
            Key: `punches/${file}`,
            Body: JSON.stringify(results.uploadable[file]),
          };

          s3.putObject(params, (err, data) => {
            if (err) throw err;

            done += 1;
            if (done === length) {
              console.log(`Uploaded ${length} punchfile${length === 1 ? '' : 's'}.`);
              return resolve(results);
            }
          });
        }
      });
    },
    download(results) {
      return new Promise((resolve, reject) => {
        const { length } = results.downloads;
        if (length === 0) {
          results.downloaded = [];
          console.log('Nothing to download.');
          return resolve(results);
        }

        const downloaded = {};
        let done = 0;

        results.downloads.forEach(file => {
          const params = {
            Bucket: config.bucket,
            Key: `punches/${file}`,
          };

          s3.getObject(params, (err, obj) => {
            if (err) throw err;

            downloaded[file] = JSON.parse(obj.Body);
            downloaded[file].updated = results.manifest[file];

            done += 1;
            if (done === length) {
              results.downloaded = downloaded;
              console.log(`Downloaded ${length} punchfile${length === 1 ? '' : 's'}.`);
              return resolve(results);
            }
          });
        });
      });
    },
  };
};