module.exports = function(config, Punch) {
  return {
    async getManifest() {
      return {};
    },

    async upload(uploads) {
      return uploads.map(p => p);
    },

    async download(downloads) {
      return [];
    },

    async delete(ids) {
      return ids;
    }
  };
};
