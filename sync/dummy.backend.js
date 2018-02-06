// Sync with Amazon S3

module.exports = function(config, flags) {
  if (!config) throw new Error('Dummy sync module was not initialized with a config file.');

  function getManifest() {
    return new Promise(resolve => resolve({}));
  };

  async function upload(results) {
    results._dummy = true;
    results.uploaded = [];
    return new Promise(resolve => resolve(results));
  };

  function download(results) {
    results.downloaded = [];
    return new Promise(resolve => resolve(results));
  };

  return {
    getManifest,
    upload,
    download,
  };
};
