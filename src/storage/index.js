const services = {
  mock: {
    default: "./services/mock.service"
  },
  ledger: {
    default: "./services/ledger.service",
    server: "./services/leger.service.server"
  }
};

module.exports = function(config) {
  const storageName = config.storageType.toLowerCase();

  if (services[storageName]) {
    const { runtimeType } = config;
    let servicePath = services[storageName].default;

    if (runtimeType && services[storageName][runtimeType]) {
      servicePath = services[storageName][runtimeType];
    }

    return require(servicePath);
  } else {
    throw new Error(`Storage service ${config.storageType} does not exist.`);
  }
};
