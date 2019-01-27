module.exports = (config, name) => {
  return config.projects[name]
    ? config.projects[name].name
    : name;
};