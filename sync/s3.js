// Sync with Amazon S3

const fs = require('fs');
const aws = require('aws-sdk');

module.exports = function(config) {
  if (!config) throw new Error('S3 sync module was not initialized with a config file.');
  if (!config.credentials) throw new Error('S3 sync config doesn\'t include a credentials key.');
  
  let credentials;

  function validateCreds(creds) {
    
  }

  switch (typeof config.credentials) {
  case 'string':
    if (fs.existsSync(config.credentials)) {
      try {
        credentials = JSON.parse(fs.readFileSync(config.credentials));
      } catch (err) {
        throw new Error('There was a problem reading the S3 credentials file: ' + err);
      }
    } else {
      throw new Error('S3 sync credentials was a string, but is an invalid path. File does not exist.');
    }
    break;
  case 'object':
    credentials = config.credentials;
    validateCreds(credentials);
    break;
  default:
    throw new Error('S3 sync credentials value is an unspecified type: ' + typeof config.credentials);
  }

  console.log(credentials);

  return {
    getManifest() {
      
    },
    upload(files) {

    },
    download(files) {

    },
  };
};