module.exports = function (config, Punch) {
  const { descendingBy } = require("../../utils/sort-factories");

  let stored = [];

  const mock = {
    save: jest.fn(),
    current: jest.fn().mockImplementation(() => {
      return stored.find((s) => !s.out);
    }),
    latest: jest.fn().mockImplementation((project) => {
      return stored.sort(descendingBy("in"))[0];
    }),
    filter: jest.fn().mockImplementation((test) => {
      return stored.filter((s) => test(s));
    }),
    find: jest.fn().mockImplementation((test) => {
      return stored.find((s) => test(s));
    }),
    delete: jest.fn().mockImplementation((punch) => {
      stored = stored.filter((s) => s.id !== punch.id);
    }),
    commit: jest.fn(),
    cleanUp: jest.fn(),
  };

  return {
    mock,
    Storage: function () {
      stored = [
        new Punch({
          project: "test",
          in: Date.now() - 29132,
          out: Date.now() - 22222,
        }),
        new Punch({
          project: "punch",
          in: Date.now() - 12345,
          out: Date.now() - 150,
        }),
        new Punch({ project: "test", in: Date.now() }),
      ];

      return mock;
    },
  };
};
