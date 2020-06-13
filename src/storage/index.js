const services = {
  ledger: () => require("./services/ledger.service"),
  sqlite: () => require("./services/sqlite.service"),
};

module.exports = function (config) {
  const storageName = config.storageType.toLowerCase();

  if (services[storageName]) {
    return services[storageName]().bind(null, config);
  } else {
    throw new Error(
      `Storage service \`${config.storageType}\` does not exist.`
    );
  }
};
