module.exports = env => {
  env.addFilter("prepend", (value, ...strings) => {
    for (let i = 0; i < strings.length; i++) {
      value = strings[i] + value;
    }

    return value;
  });
};
