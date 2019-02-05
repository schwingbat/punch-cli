const extract = require("./extract.js");

describe("extract", () => {
  it("returns an empty objects list if comment has no objects", () => {
    const comment = "This is a comment without objects";

    expect(extract(comment)).toEqual({
      comment,
      objects: [],
      tags: []
    });
  });

  it("parses positions and values for objects", () => {
    const comment = "This is a comment with objects @task:1234 @pickle:flarf";
    const result = extract(comment);

    expect(result).toEqual({
      comment,
      objects: [
        {
          key:   { start: 32, end: 36, string: "task" },
          value: { start: 37, end: 41, string: "1234" }
        },
        {
          key:   { start: 43, end: 49, string: "pickle" },
          value: { start: 50, end: 55, string: "flarf" }
        },
      ],
      tags: []
    });
  });

  it("handles strings with objects not at the end", () => {
    const comment = "This one's got @some:objects right #in-the-middle of it";
    const result = extract(comment);
    
    expect(result).toEqual({
      comment,
      objects: [
        {
          key:   { start: 16, end: 20, string: "some" },
          value: { start: 21, end: 28, string: "objects" }
        },
      ],
      tags: [
        { start: 35, end: 49, string: "in-the-middle" }
      ]
    });
  });

  it("parses positions and values for tags", () => {
    const comment = "Now with #awesome tag support! @vsts:1234 #tags";

    expect(extract(comment)).toEqual({
      comment,
      objects: [
        {
          key:   { start: 32, end: 36, string: "vsts" },
          value: { start: 37, end: 41, string: "1234" }
        },
      ],
      tags: [
        { start:  9, end: 17, string: "awesome" },
        { start: 42, end: 47, string: "tags" }
      ]
    });
  });
});
