const NEWLINE = "__NEWLINE__";

module.exports = class Buffer {
  _indent = [];
  _array = [];

  push(...items) {
    const lines = [];
    const indent = this._indent.join("");

    lines.push(indent);

    for (let i = 0; i < items.length; i++) {
      const parts = items[i].split("\n");

      for (let p = 0; p < parts.length; p++) {
        lines.push(parts[p]);

        if (p + 1 < parts.length) {
          lines.push(NEWLINE);
        }
      }
    }

    this._array.push(...lines);
    return this;
  }

  /**
   * Inserts one or more line breaks into the buffer.
   *
   * @param {number} count - Number of line breaks to insert (defaults to 1)
   */
  newline(count = 1) {
    for (let i = 0; i < count; i++) {
      this._array.push(NEWLINE);
    }

    return this;
  }

  indent(spaces, character) {
    this.dedent();

    if (typeof spaces === "string" && character == null) {
      this.indentBy(1, spaces);
    } else {
      this.indentBy(spaces || 2, character || " ");
    }

    return this;
  }

  dedent() {
    this._indent = [];
    return this;
  }

  indentBy(spaces = 2, character = " ") {
    for (let i = 0; i < spaces; i++) {
      this._indent.push(character);
    }
    return this;
  }

  dedentBy(spaces = 2) {
    this._indent = this._indent.slice(0, this._indent.length - spaces);
    return this;
  }

  toString() {
    return this._array
      .map((x) => (x === NEWLINE ? "\n" : x))
      .filter((x) => x !== "")
      .join("");
  }
};
