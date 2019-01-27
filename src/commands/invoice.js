const { confirm } = require("../punch/utils");
const { labelTable } = require("../logging/printing");
const formatDate = require("date-fns/format");
const getLabelFor = require("../utils/get-label-for");
const Invoicer = require("../invoicing/invoicer");
const Loader = require("../utils/loader");
const parseDate = require("../utils/parse-date");
const path = require("path");
const resolvePath = require("../utils/resolve-path");

module.exports = ({ config, Punch }) => ({
  signature: "invoice <project> <startDate> <endDate> <outputFile>",
  description: "automatically generate an invoice using punch data",
  arguments: [{
    name: "project",
    description: "project alias",
    parse: function (name) {
      const project = config.projects[name];
      if (project) {
        return project;
      } else {
        throw new Error("Project is not in your config file");
      }
    }
  }, {
    name: "startDate",
    description: "start date for invoice period",
    parse: parseDate
  }, {
    name: "endDate",
    description: "end date for invoice period",
    parse: parseDate
  }, {
    name: "outputFile",
    description: "file to output to (extension determines format)",
    parse: resolvePath
  }],
  options: [
    {
      name: "format",
      description: "specify a format rather than guessing from file name",
      type: "string"
    },
    {
      name: "yes",
      short: "y",
      description: "generation without confirming details",
      type: "boolean"
    }
  ],
  run: async function (args) {
    const active = await Punch.current();

    if (active && active.project === args.project) {
      return console.log(`You're currently punched in on ${getLabelFor(config, active.project)}. Punch out before creating an invoice.`);
    }

    let { project, startDate, endDate, outputFile } = args;

    if (!project.hourlyRate) {
      console.log(`${getLabelFor(config, project)} has no hourly rate set}`);
      return;
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    let fileFormat;

    if (args.options.format) {
      fileFormat = args.options.format;
    } else {
      let ext = path.extname(outputFile);

      switch (ext.toLowerCase()) {
      case ".pdf":
        fileFormat = "PDF";
        break;
      case ".html":
        fileFormat = "HTML";
        break;
      case ".txt":
      case ".md":
        return console.log(`Exporting invoices as ${ext.toLowerCase()} is not yet supported. Use HTML or PDF.`);
      default:
        return console.log(`Can't export to file with an extension of ${ext}`);
      }
    }

    console.log("\n" + labelTable([
      { label: "Project", value: project.name },
      { label: "Start Date", value: formatDate(startDate, config.display.dateFormat) },
      { label: "End Date", value: formatDate(endDate, config.display.dateFormat) },
      { label: "Invoice Format", value: fileFormat },
      { label: "Output To", value: resolvePath(outputFile) }
    ]));

    if (args.options.yes || confirm("Create invoice?")) {
      const loader = Loader({ text: "Generating invoice..." });
      loader.start();

      const invoicer = Invoicer(config);
      const punches = await Punch.select(p =>
        p.project === project.alias &&
        p.in.getTime() >= startDate.getTime() &&
        p.in.getTime() <= endDate.getTime());

      try {
        await invoicer.generate({
          project,
          start: startDate,
          end: endDate,
          today: new Date(),
          punches,
          user: config.user,
          output: {
            path: resolvePath(outputFile),
            format: fileFormat,
            customFormat: !!args.options.format
          }
        }, false);
        loader.stop(`${fileFormat} invoice generated!`);
      } catch (err) {
        loader.stop(`There was an error while generating the invoice: ${err.message}`);
      }
    }
  }
});