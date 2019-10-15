const realTime = require("./real-time");
const fmtDuration = require("../format/duration");

describe("realTime", () => {
  it("works", () => {
    const spans = [
      {
        name: "test#1a",
        start: new Date("2018-12-12T07:12:00Z"),
        end: new Date("2018-12-12T10:16:00Z")
      },
      {
        name: "test#1b",
        start: new Date("2018-12-12T13:52:00Z"),
        end: new Date("2018-12-12T18:05:00Z")
      },
      {
        name: "test#2a",
        start: new Date("2018-12-12T09:00:16Z"),
        end: new Date("2018-12-12T12:36:01Z")
      },
      {
        name: "test#2b",
        start: new Date("2018-12-12T14:55:00Z"),
        end: new Date("2018-12-12T15:19:12Z")
      },
      {
        name: "test#2c",
        start: new Date("2018-12-12T16:04:10Z"),
        end: new Date("2018-12-12T17:52:00Z")
      },
      {
        name: "test#3",
        start: new Date("2018-12-12T11:15:00Z"),
        end: new Date("2018-12-12T15:41:00Z")
      }
    ];

    const value = realTime(spans);

    // Expected total time: 10:53 or 39,180,000 milliseconds

    expect(value).toBe(39180000);
  });
});
