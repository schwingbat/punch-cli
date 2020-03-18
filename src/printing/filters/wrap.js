const wordWrap = require("@fardog/wordwrap");

module.exports = env => {
  env.addFilter("wrap", (value, width, kwargs) => {
    const wrapper = wordWrap(0, width, {
      lengthFn: require("../../utils/print-length.js")
    });

    let wrapped = wrapper(value);

    if (kwargs.wrapTo != null) {
      wrapped = wrapped.replace("\n", "\n" + kwargs.wrapTo);
    }

    return wrapped;
  });
};
