const Buffer = require("./Buffer");

describe("Buffer", () => {
  let buf;

  beforeEach(() => {
    buf = new Buffer();
  });

  describe("push", () => {
    it("adds content to the buffer", () => {
      const output = buf.push("test").toString();
      expect(output).toBe("test");
    });

    it("adds multiple strings to the buffer", () => {
      const output = buf.push("test", "1", "2", "3").toString();
      expect(output).toBe("test123");
    });
  });

  describe("newline", () => {
    it("adds a line break to the output text", () => {
      const output = buf.push("test").newline().toString();
      expect(output).toBe("test\n");
    });

    it("adds a specified number of newlines", () => {
      const output = buf.push("test").newline(5).toString();
      expect(output).toBe("test\n\n\n\n\n");
    });
  });

  describe("indent", () => {
    it("indents following lines by 2 spaces by default", () => {
      const output = buf
        .push("line 1", "\n")
        .indent()
        .push("line 2A", "\n")
        .push("line 2B");

      expect(output.toString()).toBe("line 1\n  line 2A\n  line 2B");
    });

    it("indents following lines by a specified number of spaces", () => {
      const output = buf
        .push("line 1", "\n")
        .indent(1)
        .push("line 2A", "\n")
        .push("line 2B", "\n")
        .indent(5)
        .push("line 3A", "\n")
        .push("line 3B");

      expect(output.toString()).toBe(
        "line 1\n line 2A\n line 2B\n     line 3A\n     line 3B"
      );
    });

    it("indents following lines by a specified number of specified characters", () => {
      const output = buf
        .push("line 1", "\n")
        .indent(2, "+")
        .push("line 2A", "\n")
        .push("line 2B", "\n")
        .indent(1, "?%111")
        .push("line 3A", "\n")
        .push("line 3B");

      expect(output.toString()).toBe(
        "line 1\n++line 2A\n++line 2B\n?%111line 3A\n?%111line 3B"
      );
    });

    it("indents following lines by a string literal", () => {
      const output = buf
        .push("line 1", "\n")
        .indent("++")
        .push("line 2A", "\n")
        .push("line 2B", "\n")
        .indent("?%111")
        .push("line 3A", "\n")
        .push("line 3B");

      expect(output.toString()).toBe(
        "line 1\n++line 2A\n++line 2B\n?%111line 3A\n?%111line 3B"
      );
    });
  });

  describe("dedent", () => {
    it("removes indentation", () => {
      const output = buf
        .push("line 1", "\n")
        .indent("++")
        .push("line 2A", "\n")
        .push("line 2B", "\n")
        .dedent()
        .push("line 3", "\n")
        .indent(2)
        .push("line 4");

      expect(output.toString()).toBe(
        "line 1\n++line 2A\n++line 2B\nline 3\n  line 4"
      );
    });
  });

  describe("toString", () => {});
});
