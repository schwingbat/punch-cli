const printLen = require("../utils/print-length");

class Table {
  constructor(options = {}) {
    this.rows = [];
    this.options = options;
  }

  push(...rows) {
    this.rows.push(...rows);
  }

  _leftAlignString(str, length) {
    while (printLen(str) < length) {
      str += " ";
    }
    return str;
  }

  _rightAlignString(str, length) {
    while (printLen(str) < length) {
      str = " " + str;
    }
    return str;
  }

  _centerAlignString(str, length) {
    let difference = Math.abs(length - str.length);
    let left = Math.round(difference / 2);
    let right = difference - left;

    return this._addStringPadding(str, left, right);
  }

  _addStringPadding(str, left = 0, right = 0) {
    while (left > 0) {
      str = " " + str;
      left -= 1;
    }
    while (right > 0) {
      str = str + " ";
      right -= 1;
    }
    return str;
  }

  toString() {
    let rows = [];
    let columnWidths = [];

    // TODO: Figure out a way to do this that doesn't require two loops.
    for (let r = 0; r < this.rows.length; r++) {
      for (let c = 0; c < this.rows[r].length; c++) {
        columnWidths[c] = Math.max(
          printLen(this.rows[r][c]) || 0,
          columnWidths[c] || 0
        );
      }
    }

    for (let r = 0; r < this.rows.length; r++) {
      let cells = [];

      for (let c = 0; c < this.rows[r].length; c++) {
        let cell = this.rows[r][c];
        const width = columnWidths[c];
        let styles = {
          align: "left",
          leftPadding: 0,
          rightPadding: 0
        };

        if (this.options.columnStyle) {
          if (this.options.columnStyle[c]) {
            styles = Object.assign(styles, this.options.columnStyle[c]);
          } else {
            styles = Object.assign(styles, this.options.columnStyle);
          }
        }

        switch (styles.align) {
          case "left":
            cell = this._leftAlignString(cell, width);
            break;
          case "right":
            cell = this._rightAlignString(cell, width);
            break;
          case "center":
            cell = this._centerAlignString(cell, width);
            break;
        }

        cell = this._addStringPadding(
          cell,
          styles.leftPadding,
          styles.rightPadding
        );
        cells.push(cell);
      }

      rows.push(cells.join(" "));
    }

    return rows.join("\n") + "\n";
  }
}

module.exports = Table;
