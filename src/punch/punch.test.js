const path = require("path");

const configPath = path.join(__dirname, "../test/testconfig.json");
// const brokenConfigPath = path.join(__dirname, '../test/brokentestconfig.json')
const MockStorage = require("../test/mocks/storage.mock");
const config = require("../config");
const _punch = require("./punch");
const isValidDate = require("date-fns/isValid");

describe("Punch", () => {
  let Punch;
  let mock;
  let Storage;

  beforeEach(() => {
    Punch = _punch(config.load(configPath));
    const mockStorage = MockStorage(config, Punch);
    Storage = mockStorage.Storage();
    mock = mockStorage.mock;

    Punch.setStorage(Storage);
  });

  describe("constructor", () => {
    it("instantiates", () => {
      expect(new Punch({ project: "test" }) instanceof Punch).toBe(true);
    });

    it("generates a UUID if none is given", () => {
      const punch = new Punch({ project: "test" });
      expect(typeof punch.id).toBe("string");
    });

    it("instantiates with comments", () => {
      const punch = new Punch({
        project: "test",
        comments: [
          {
            comment: "test 1",
            timestamp: 12345,
          },
          {
            comment: "test 2",
            timestamp: 123456,
          },
        ],
      });

      expect(punch.comments.length).toBe(2);
    });

    it("creates comment objects if comments are plain strings", () => {
      const punch = new Punch({
        project: "test",
        comments: ["test 1", "test 2"],
      });

      expect(punch.comments.length).toBe(2);
      expect(punch.comments[0].comment).toBeTruthy();
      expect(punch.comments[0].timestamp instanceof Date).toBe(true);
    });

    it("initializes in, created and updated even if no dates are passed", () => {
      const punch = new Punch({ project: "test" });

      expect(isValidDate(punch.in)).toBe(true);
      expect(punch.out).toBe(null);
      expect(isValidDate(punch.created)).toBe(true);
      expect(isValidDate(punch.updated)).toBe(true);
    });

    it("throws an error if first argument is not an object", () => {
      expect(() => new Punch("test")).toThrow();
    });

    it("throws an error if props object does not contain a project field", () => {
      expect(() => new Punch({ nope: true })).toThrow();
    });

    it("throws an error if props.project is not a string", () => {
      expect(() => new Punch({ project: 5 })).toThrow();
    });

    it("throws an error if out time is before in time", () => {
      const timeIn = new Date(2018, 3, 30, 14, 32);
      const timeOut = new Date(2018, 3, 30, 12, 30);

      expect(
        () =>
          new Punch({
            project: "test",
            in: timeIn.getTime(),
            out: timeOut.getTime(),
          })
      ).toThrow();
    });
  });

  describe("addComment", () => {
    it("adds a comment", () => {
      const punch = new Punch({ project: "test" });
      expect(punch.comments.length).toBe(0);

      punch.addComment("comment");
      expect(punch.comments.length).toBe(1);
      expect(punch.comments[0].comment).toBe("comment");
    });
  });

  describe("comment.toString", () => {
    it("returns the comment text when called on a comment", () => {
      const punch = new Punch({ project: "test" });
      punch.addComment("test comment");

      expect(punch.comments[0].comment).toBe("test comment");
      expect(punch.comments[0].toString()).toBe("test comment");
    });
  });

  describe("punchOut", () => {
    let punch;

    beforeEach(() => {
      punch = new Punch({ project: "test" });
    });

    it("sets punch.out value", () => {
      expect(punch.out).toBe(null);
      punch.punchOut();
      expect(punch.out).not.toBe(null);
    });

    it("adds a comment if one is passed", () => {
      expect(punch.comments.length).toBe(0);
      punch.punchOut("test comment");
      expect(punch.comments.length).toBe(1);
    });

    it("calls .save() if options.autosave is true", () => {
      punch.punchOut("test comment", { autosave: true });
      expect(mock.save.mock.calls.length).toBe(1);
    });

    it("uses time specified in options.time", () => {
      const time = new Date(2018, 4, 10, 15, 22, 12);
      punch.punchOut(null, { time: time });
      expect(punch.out.getTime()).toBe(time.getTime());
    });
  });

  describe("duration", () => {
    it("returns a value in milliseconds", () => {
      const punch = new Punch({ project: "test" });
      expect(typeof punch.duration()).toBe("number");
    });

    it("calculates time correctly", () => {
      const punch = new Punch({ project: "test" });
      punch.punchOut();
      expect(punch.duration()).toEqual(
        punch.out.getTime() - punch.in.getTime()
      );
    });
  });

  describe("pay", () => {
    it("returns the billable amount for a punch based on punch time and project rate", () => {
      const timeIn = new Date(2018, 3, 15, 12, 10);
      const timeOut = new Date(2018, 3, 15, 14, 40);
      const punch = new Punch({
        project: "test",
        in: timeIn.getTime(),
        out: timeOut.getTime(),
        rate: 62,
      });
      expect(punch.pay()).toBe(155);
    });
  });

  describe("toJSON", () => {
    let data;
    let data2;
    let punch;
    let punch2;

    beforeAll(() => {
      let timeIn = new Date(2018, 1, 11, 9, 22, 10);
      let timeOut = new Date(2018, 1, 11, 11, 32, 58);

      data = {
        project: "test",
        in: timeIn.getTime(),
        out: timeOut.getTime(),
        comments: [
          {
            comment: "test comment",
            timestamp: timeOut.getTime(),
          },
        ],
        rate: 35.0,
        created: timeIn.getTime(),
        updated: timeOut.getTime(),
      };

      data2 = Object.assign({}, data);
      data2.out = null;

      punch = new Punch(data);
      punch2 = new Punch(data2);
    });

    it("converts to JSON", () => {
      const json = punch.toJSON();

      expect(typeof json.id).toBe("string");
      expect(typeof json.project).toBe("string");
      expect(typeof json.in).toBe("number");
      expect(typeof json.out).toBe("number");
      expect(typeof json.rate).toBe("number");
      expect(Array.isArray(json.comments)).toBe(true);
      expect(typeof json.created).toBe("number");
      expect(typeof json.updated).toBe("number");

      expect(json.in).toBe(data.in);
      expect(json.out).toBe(data.out);
      expect(json.rate).toBe(data.rate);
      expect(json.comments.length).toBe(1);
      expect(json.comments[0].comment).toBe("test comment");
      expect(json.comments[0].timestamp).toBe(data.out);

      const json2 = punch2.toJSON();

      expect(json2.out).toBe(null);
    });
  });

  describe("save", () => {
    it("calls storage.save", async () => {
      const punch = new Punch({ project: "test" });
      await punch.save();
      expect(mock.save.mock.calls.length).toBe(1);
    });
  });

  describe("static", () => {
    describe("current", () => {
      it("calls storage.current", async () => {
        await Punch.current();
        expect(mock.current.mock.calls.length).toBe(1);
      });
    });

    describe("latest", () => {
      it("calls storage.latest", async () => {
        await Punch.latest();
        expect(mock.latest.mock.calls.length).toBe(1);
      });
    });

    describe("filter", () => {
      it("calls storage.filter", async () => {
        await Punch.filter(() => true);
        expect(mock.filter.mock.calls.length).toBe(1);
      });
    });

    describe("all", () => {
      it("calls storage.filter", async () => {
        await Punch.all();
        expect(mock.filter.mock.calls.length).toBe(1);
      });
    });
  });
});
