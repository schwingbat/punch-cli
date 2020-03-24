const fs = require("fs");
const path = require("path");
const nunjucks = require("nunjucks");

const templatesPath = path.join(__dirname, "templates");
const filtersPath = path.join(__dirname, "filters");
const viewsPath = path.join(__dirname, "views");

module.exports = config => {
  const env = nunjucks.configure(templatesPath);

  // ----- Load Precompiled Templates ----- //

  // try {
  //   require(path.join(templatesPath, "compiled.js"));
  // } catch (err) {
  //   console.error(err);
  // }

  // ----- Load Filters ----- //

  const filters = fs.readdirSync(filtersPath);

  filters.forEach(fileName => {
    const fullPath = path.join(filtersPath, fileName);
    const exported = require(fullPath);

    if (typeof exported === "function") {
      exported(env, config);
    } else {
      throw new Error(`${fileName} does not export a function.`);
    }
  });

  // ----- Exports ----- //

  /**
   * Calls the named template with the given props and returns the resulting string.
   *
   * @param {string} name - Template name (file name without extension)
   * @param {*} props - Values to pass to the template
   */
  function template(name, props) {
    return new Promise((resolve, reject) => {
      env.render(name + ".njk", props, (err, res) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(res);
        }
      });
    });
  }

  /**
   * Calls the named view function with the given props and returns the resulting string.
   * Views can do additional processing before printing that wouldn't be easy in a template alone.
   *
   * @param {string} name - View name
   * @param {*} props - Values to pass to the view
   */
  function view(name, props) {
    try {
      const func = require(path.join(viewsPath, name));
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  return {
    template
  };
};
