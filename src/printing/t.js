function table(options = {}, parent = null) {
  let values = [];
  let row = null;
  let parent = parent;

  const pushRow = () => {
    if (row != null) {
      values.push(row);
      row = null;
    }
  };

  const render = () => {};

  return {
    header(options = {}) {
      pushRow();
      row = {
        type: "header",
        items: [],
        options
      };

      return this;
    },

    row(options = {}) {
      pushRow();
      row = {
        type: "row",
        items: [],
        options
      };

      return this;
    },

    column(value, options = {}) {
      row.items.push({
        value,
        options
      });

      return this;
    },

    write() {
      if (parent) {
        // Write to parent and return it to resume chaining.
        parent.buffer += render();
        return parent;
      }
    },

    toString() {
      return render();
    }
  };
}

module.exports = function t(value, options = {}) {
  if (!(this instanceof t)) {
    return new t(value, options);
  }

  this.value = value;
  this.buffer = "";
};

t.prototype.indent = function(spaces = 2) {
  for (let i = 0; i < spaces; i++) {
    this.buffer += " ";
  }

  return this;
};

t.prototype.table = function(options = {}) {
  return table(options, this);
};

t.prototype.toString = function() {
  return this.buffer;
};
