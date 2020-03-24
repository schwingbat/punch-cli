module.exports = (env, config) => {
  env.addFilter("projectconfig", name => {
    return config.projects[name] || null;
  });
};
