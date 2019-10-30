const path = require("path");
const defaultConfig = require("../defaults.js");
const config = require("../index");
const brokenConfigPath = path.join(__dirname, "../test/brokentestconfig.json");

describe("Config", () => {
  beforeEach(() => {
    // Make sure any config is unloaded before each test to avoid unexpected values interfering.
    config.__clear_current__();
  })

  describe("load", () => {
    it("successfully loads config from a MON file", () => {
      const testConfPath = path.join(__dirname, "./monconfig.mon");
      const conf = config.load(testConfPath);

      expect(conf.user.name).toBe("SET BY MON TESTCONFIG");
    });

    it("successfully loads config from a YAML file", () => {
      const testConfPath = path.join(__dirname, "./yamlconfig.yaml");
      const conf = config.load(testConfPath);

      expect(conf.user.name).toBe("SET BY YAML TESTCONFIG");
    });

    it("throws an error when trying to load a .json config file", () => {
      const testConfPath = path.join(__dirname, "./jsonconfig.json");

      console.log(testConfPath);

      expect(() => {
        config.load(testConfPath);
      }).toThrow();
    });
  
    it("loads the default config when not given a path", () => {
      expect(config.load()).toBeTruthy();
    });

    it("sets global chalk.level to 0 if display.fontColors is false", () => {
      const testConfPath = path.join(__dirname, "./testconfig");
      const conf = config.load(testConfPath);

      expect(require("chalk").level).toBe(0);
    });
  });

  describe("current", () => {
    it("loads config if config is not yet loaded", () => {
      // Use testing functions to ensure current value is cleared.
      config.__clear_current__();
      expect(config.__get_raw_current__()).toBe(null);

      const value = config.current();

      expect(value).not.toBe(null);
      expect(value).not.toBe(undefined);
    });
  });
});
