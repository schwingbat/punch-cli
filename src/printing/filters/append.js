module.exports = env => {
  env.addFilter("append", (value, ...strings) => {
    for (let i = 0; i < strings.length; i++) {
      value += strings[i];
    }

    return value;
  });
};
