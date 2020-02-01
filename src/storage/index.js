const services = {
  mock: "./services/mock.service",
  ledger: "./services/ledger.service"
};

module.exports = function(config) {
  const storageName = config.storageType.toLowerCase();

  if (services[storageName]) {
    let servicePath = services[storageName];

    return require(servicePath).bind(null, config);
  } else {
    throw new Error(
      `Storage service \`${config.storageType}\` does not exist.`
    );
  }
};
