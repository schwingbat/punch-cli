const extract = require("./extract.js");

describe("extract", () => {
  it("returns an empty objects list if comment has no objects", () => {
    const comment = "This is a comment without objects";

    expect(extract(comment)).toEqual({
      comment,
      objects: [],
      tags: [],
    });
  });

  it("parses positions and values for objects", () => {
    const comment = "This is a comment with objects @task:1234 @pickle:flarf";
    const result = extract(comment);

    expect(result).toEqual({
      comment,
      objects: [
        {
          start: 31,
          end: 41,
          key: { start: 32, end: 36, string: "task" },
          value: { start: 37, end: 41, string: "1234" },
        },
        {
          start: 42,
          end: 55,
          key: { start: 43, end: 49, string: "pickle" },
          value: { start: 50, end: 55, string: "flarf" },
        },
      ],
      tags: [],
    });
  });

  it("handles strings with objects not at the end", () => {
    const comment = "This one's got @some:objects right #in-the-middle of it";
    const result = extract(comment);

    expect(result).toEqual({
      comment,
      objects: [
        {
          start: 15,
          end: 28,
          key: { start: 16, end: 20, string: "some" },
          value: { start: 21, end: 28, string: "objects" },
        },
      ],
      tags: [{ start: 35, end: 50, string: "in-the-middle", params: [] }],
    });
  });

  it("parses positions and values for tags", () => {
    const comment = "Now with #awesome tag support! @vsts:1234 #tags";

    expect(extract(comment)).toEqual({
      comment,
      objects: [
        {
          start: 31,
          end: 41,
          key: { start: 32, end: 36, string: "vsts" },
          value: { start: 37, end: 41, string: "1234" },
        },
      ],
      tags: [
        { start: 9, end: 18, string: "awesome", params: [] },
        { start: 42, end: 48, string: "tags", params: [] },
      ],
    });
  });

  it("parses tags with parameters", () => {
    const comment =
      "This is a comment with #tag[param] and another #multi[param, tag]";
    const result = extract(comment);

    expect(result).toEqual({
      comment,
      objects: [],
      tags: [
        { start: 23, end: 34, string: "tag", params: ["param"] },
        { start: 47, end: 65, string: "multi", params: ["param", "tag"] },
      ],
    });
  });

  // Allowed tag characters: [a-zA-Z0-9-+_]
  describe("terminating at special characters", () => {
    it("ends the tag at a comma", () => {
      const { tags } = extract("Test comment with #test, wow!");

      expect(tags.length).toBe(1);
      expect(tags[0].string).toBe("test");
    });

    it("ends the tag at a semicolon", () => {
      const { tags } = extract("Test comment with #test; wow!");

      expect(tags.length).toBe(1);
      expect(tags[0].string).toBe("test");
    });

    it("ends the tag at a colon", () => {
      const { tags } = extract("Test comment with #test: wow!");

      expect(tags.length).toBe(1);
      expect(tags[0].string).toBe("test");
    });
  });
});
