module.exports = function(config) {
  const { descendingBy } = require("../../utils/sort-factories");

  let stored = [];

  const mock = {
    save: jest.fn(),
    current: jest.fn().mockImplementation(() => {
      return stored.find(s => !s.out);
    }),
    latest: jest.fn().mockImplementation(project => {
      return stored.sort(descendingBy("in"))[0];
    }),
    select: jest.fn().mockImplementation(test => {
      return stored.filter(s => test(s));
    })
  };

  return {
    mock,
    Storage: function(config, Punch) {
      stored = [
        new Punch({
          project: "test",
          in: Date.now() - 29132,
          out: Date.now() - 22222
        }),
        new Punch({
          project: "punch",
          in: Date.now() - 12345,
          out: Date.now() - 150
        }),
        new Punch({ project: "test", in: Date.now() })
      ];

      return mock;
    }
  };
};
