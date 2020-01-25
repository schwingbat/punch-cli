module.exports = function(config, Punch) {
  return {
    getManifest() {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({});
        }, Math.random() * 300 + 200);
      });
    },

    upload(uploads) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(uploads.map(p => p));
        }, Math.random() * 300 + 200);
      });
    },

    download(downloads) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve([{}, {}, {}]);
        }, Math.random() * 300 + 200);
      });
    }
  };
};
