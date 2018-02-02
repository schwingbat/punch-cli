// Functions for reading and writing to punch files.
const fs = require('fs');
const path = require('path');

module.exports = function(config) {

  function Punchfile(props = {}) {
    this.created = new Date(props.created || props.updated || new Date());
    this.updated = new Date(props.updated || new Date());
    this.punches = [];

    if (props.punches) {
      this.punches = props.punches.map(p => {
        if (p.in) p.in = new Date(p.in);
        if (p.out) p.out = new Date(p.out);
        p._file = this;
        return p;
      });
    }

    const y = this.created.getFullYear();
    const m = this.created.getMonth() + 1;
    const d = this.created.getDate();

    this.fileName = `punch_${y}_${m}_${d}`;
  }

  Punchfile.prototype = {
    update() {
      this.updated = new Date();
    },
    addPunch(punch) {
      // Adds a new punch, expecting a full set of data to be passed as an object.

      const comments = Array.isArray(punch.comments)
        ? punch.comments
        : [punch.comments];

      this.punches.push({
        project: punch.project,
        in: new Date(punch.in),
        out: new Date(punch.out),
        comments,
        rewind: punch.rewind || 0,
      });

      this.update();
    },
    punchIn(project) {
      // Add a fresh punch punched in at the current time.

      this.punches.push({
        project,
        in: new Date(),
        out: null,
        comments: [],
        rewind: 0
      });

      this.update();
    },
    punchOut(project) {
      // Find most recent punch in with matching project name.

      const punch = this.punches
        .filter(p => !p.out || p.project !== project)
        .sort((a, b) => a.in < b.in)
        [0];

      if (punch) {
        punch.out = new Date();
        this.update();
      } else {
        throw new Error('No punches with that project name are currently missing a punch out');
      }
    },
    mostRecentPunch(project) {
      let punches = this.punches.map(p => p);

      if (project) {
        punches = punches.filter(p => p.project === project);
      }

      return punches.sort((a, b) => a.in > b.in).pop();
    },
    toJSON(pretty = false) {
      const obj = {
        created: this.created.getTime(),
        updated: this.updated.getTime(),
        punches: this.punches.map(p => {
          return {
            project: p.project,
            in: p.in ? p.in.getTime() : null,
            out: p.out ? p.out.getTime() : null,
            rewind: p.rewind || 0,
            comments: p.comment ? [p.comment] : p.comments.filter(c => c),
          };
        }),
      };

      if (pretty) {
        return JSON.stringify(obj, null, 2);
      } else {
        return JSON.stringify(obj);
      }
    },
    save() {
      this.update();
      const outPath = path.join(config.punchPath, `${this.fileName}.json`);
      return fs.writeFileSync(outPath, this.toJSON(true));
    }
  }

  Punchfile.read = function(filePath) {
    // Reads a file and returns a new Punchfile object using the result.
    const p = path.resolve(filePath);

    try {
      const file = fs.readFileSync(p);
      const data = JSON.parse(file);
      return new Punchfile(data);
    } catch (err) {
      throw new Error(`Failed to read file: ${err.message}`);
    }
  }

  Punchfile.readOrCreate = function(filePath) {
    try {
      return this.read(filePath);
    } catch (err) {
      return new Punchfile();
    }
  }

  Punchfile.mostRecent = function() {
    const files = fs.readdirSync(config.punchPath).sort();

    return this.read(path.join(config.punchPath, files[files.length - 1]));
  }

  Punchfile.forDate = function(date) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();

    const fileName = `punch_${y}_${m}_${d}.json`;

    return this.readOrCreate(path.join(config.punchPath, fileName));
  }

  Punchfile.all = function() {
    // Loads all punch files into an array and return it.
    const files = fs.readdirSync(path.join(config.punchPath));
    return files.map(f => this.read(path.join(config.punchPath, f)));
  }

  return Punchfile;
}
