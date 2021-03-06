const path = require("path");
const uuid = require("uuid");
const chalk = require("chalk");
const is = require("@schwingbat/is");
const extractObjects = require("./comment-objects/extract");
const { ascendingBy } = require("../utils/sort-factories");

const tagRendererPath = path.join(
  __dirname,
  "comment-objects",
  "tag-renderers"
);

function renderTag(tag) {
  try {
    const renderer = require(path.join(tagRendererPath, tag.string + ".js"));
    return renderer(tag.string, tag.params);
  } catch (err) {
    return chalk.magenta("#" + tag.string);
  }
}

module.exports = function (config) {
  /*=======================*\
  ||       Comments        ||
  \*=======================*/

  class Comment {
    constructor(comment, timestamp = new Date(), id = uuid.v1()) {
      const extracted = extractObjects(comment);
      this.id = id;
      this.objects = extracted.objects;
      this.tags = extracted.tags;
      this.comment = comment.trim();

      if (timestamp instanceof Date) {
        this.timestamp = timestamp;
      } else {
        this.timestamp = new Date(parseInt(timestamp) || Date.now());
      }
    }

    hasObject(obj) {
      if (obj[0] === "@") {
        obj = obj.slice(1);
      }
      const [key, val] = obj.split(":");
      for (let i = 0; i < this.objects.length; i++) {
        const o = this.objects[i];
        if (o.key === key && o.value.toString() === val) {
          return true;
        }
      }
      return false;
    }

    hasTag(tag) {
      tag = tag.replace(/^#/, "").toLowerCase();
      return !!this.tags.find((t) => t.string.toLowerCase() === tag);
    }

    /**
     * Returns a decorated string for printing to the console.
     */
    toString() {
      // Skip logic if possible
      if (this.objects.length === 0 && this.tags.length === 0) {
        return this.comment;
      }

      let comment = this.comment;
      let slices = [];

      for (let tag of this.tags) {
        slices.push({
          start: tag.start,
          end: tag.end,
          value: renderTag(tag),
        });
      }

      for (let object of this.objects) {
        let value = "";

        value += chalk.grey("@");
        value += chalk.green(object.key.string);
        (value += chalk.grey(":")),
          (value += chalk.yellow(object.value.string));

        slices.push({
          start: object.key.start - 1,
          end: object.value.end,
          value,
        });
      }

      // Fill in normal unformatted text in between tags and objects
      let marker = 0;
      let newSlices = [];

      slices.sort(ascendingBy("start"));

      for (let slice of slices) {
        newSlices.push({
          start: marker,
          end: slice.start - 1,
          value: comment.slice(marker, slice.start),
        });

        marker = slice.end;
      }

      if (marker < comment.length) {
        // Add end if there's still more to go.
        newSlices.push({
          start: marker,
          end: comment.length - 1,
          value: comment.slice(marker, comment.length),
        });
      }

      return slices
        .concat(newSlices)
        .sort(ascendingBy("start"))
        .map((s) => s.value)
        .join("");
    }

    toStringPlain() {
      return this.comment;
    }

    objects() {
      return this.objects;
    }

    toJSON() {
      return {
        comment: this.comment,
        timestamp: this.timestamp.getTime(),
      };
    }
  }

  /*=======================*\
  ||         Punch         ||
  \*=======================*/

  class Punch {
    /*
      id: string
      project: string
      in: Date
      out?: Date
      comments: Comment[]
      rate: number
      created: Date
      updated: Date
    */

    constructor(props) {
      if (is.not.an.object(props)) {
        throw new Error(
          "The only argument to the Punch constructor should be an object. Received " +
            typeof props
        );
      }
      if (is.not.a.string(props.project)) {
        throw new Error(
          'Punch requires a "project" field (string) to be specified in the props object.'
        );
      }

      this.id = props.id || uuid.v1();
      this.project = props.project;
      this.in = new Date(props.in || new Date());
      this.out = props.out ? new Date(props.out || new Date()) : null;
      this.comments = props.comments
        ? props.comments.map(
            (c) => new Comment(c.comment || c, c.timestamp, c.id)
          )
        : [];
      if (props.rate) {
        this.rate = props.rate;
      } else if (config.projects[props.project]) {
        this.rate = config.projects[props.project].hourlyRate || 0;
      } else {
        this.rate = 0;
      }

      if (this.out && this.out < this.in) {
        const formatDate = require("date-fns/format");
        const format = "MMM Do yyyy [at] h:mm:ss A";
        const inTime = formatDate(this.in, format);
        const outTime = formatDate(this.out, format);
        throw new Error(
          `Punch out occurs before punch in. Project: ${this.project}, in: ${inTime}, out: ${outTime}`
        );
      }

      this.created = new Date(props.created || new Date());
      this.updated = new Date(props.updated || new Date());
    }

    /**
     * Adds a new comment to the end of this punch's comment list.
     *
     * @param {string} comment - The new comment text.
     * @param {Date?} timestamp - A custom timestamp. Defaults to the current time.
     */
    addComment(comment, timestamp) {
      this.comments.push(new Comment(comment, timestamp));

      this.update();
    }

    deleteComment(id) {
      this.comments = this.comments.filter((comment) => comment.id !== id);

      this.update();
    }

    /**
     * Replaces an existing comment with a modified one.
     *
     * @param {string} id - The existing comment's GUID
     * @param {string} text - The new comment text
     * @param {Date?} timestamp - A new timestamp. Reuses existing stamp if not specified.
     */
    editComment(id, text, timestamp = null) {
      this.comments = this.comments.map((comment) => {
        if (comment.id == id) {
          return new Comment(text, timestamp || comment.timestamp, id);
        } else {
          return comment;
        }
      });
    }

    async punchOut(comment, options = {}) {
      this.out = options.time || new Date();

      this.update();

      if (comment) this.addComment(comment, this.out);
      if (options.autosave) await this.save();
    }

    /**
     * Returns the duration between start and end (or now) in milliseconds.
     *
     * @param {Date} out - (optional) override the end date for the calculation
     */
    duration(out) {
      return (out || this.out || new Date()).getTime() - this.in;
    }

    pay(out) {
      // Hours * hourlyRate
      return (this.duration(out) / 3600000) * this.rate;
    }

    durationWithinInterval(interval) {
      // Get the total amount of time that this punch overlaps
      // with the dates in the interval.

      const inAt = this.in;
      const outAt = this.out || Date.now();

      if (outAt >= interval.start && inAt <= interval.end) {
        let start = Math.max(inAt, interval.start);
        let end = Math.min(outAt, interval.end);

        return end - start;
      } else {
        return 0;
      }
    }

    payWithinInterval(interval) {
      // Figure out how much money was earned on this punch within
      // the dates of the interval.
      return (this.durationWithinInterval(interval) / 3600000) * this.rate;
    }

    hasCommentWithObject(obj) {
      for (var i = 0; i < this.comments.length; i++) {
        if (this.comments[i].hasObject(obj)) {
          return true;
        }
      }
      return false;
    }

    hasCommentWithTag(tag) {
      for (const comment of this.comments) {
        if (comment.hasTag(tag)) {
          return true;
        }
      }
      return false;
    }

    toJSON() {
      const json = {
        id: this.id,
        project: this.project,
        in: this.in.getTime(),
        out: this.out ? this.out.getTime() : null,
        rate: this.rate,
        comments: this.comments.map((comment) => comment.toJSON()),
        created: this.created.getTime(),
        updated: this.updated.getTime(),
      };
      return json;
    }

    /**
     * Set updated timestamp to the current time.
     */
    update() {
      this.updated = new Date();
    }

    async delete() {
      return storage.delete(this);
    }

    async save() {
      return storage.save(this);
    }
  }

  let storage;

  /*=======================*\
  ||        Static         ||
  \*=======================*/

  Punch.setStorage = function (_storage) {
    storage = _storage;
  };

  Punch.current = async function (project) {
    return storage.current(project);
  };

  Punch.latest = async function () {
    return storage.latest();
  };

  Punch.select = async function (fn) {
    return storage.filter(fn);
  };

  Punch.filter = async function (fn) {
    return storage.filter(fn);
  };

  Punch.find = async function (fn) {
    return storage.find(fn);
  };

  Punch.all = async function () {
    return storage.filter(() => true);
  };

  Punch.Comment = Comment;

  return Punch;
};
