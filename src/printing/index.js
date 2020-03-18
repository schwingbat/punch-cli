const fs = require("fs");
const path = require("path");
const nunjucks = require("nunjucks");

const templatesPath = path.join(__dirname, "templates");
const filtersPath = path.join(__dirname, "filters");

module.exports = config => {
  const env = nunjucks.configure(templatesPath);

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

  return {
    /**
     * Calls the named template with the given props and returns the resulting string.
     *
     * @param {string} name - Template name (file name without extension)
     * @param {*} props - Values to pass to the template
     */
    template(name, props) {
      return env.render(name + ".njk", props);
    }
  };
};
