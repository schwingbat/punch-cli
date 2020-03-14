const path = require("path");
const { confirm } = require("../punch/utils");
const { labelTable } = require("../logging/printing");
const formatDate = require("date-fns/format");
const getLabelFor = require("../utils/get-label-for");
const Invoicer = require("../invoicing/invoicer");
const Loader = require("../utils/loader");
const parseDate = require("../utils/parse-date");
const resolvePath = require("../utils/resolve-path");

module.exports = command =>
  command
    .description("generate an invoice for a project")
    .arg("project", {
      description: "project alias"
    })
    .flag("start-date", "s", {
      description: "start date for invoice period",
      parse: parseDate
    })
    .flag("end-date", "e", {
      description: "end date for invoice period",
      parse: parseDate
    })
    .flag("output-file", "o", {
      description: "file to output to",
      parse: resolvePath
    })
    .flag("format", "f", {
      description:
        "specify a format rather than inferring from output file extension"
    })
    .flag("yes", "y", {
      description: "generate without confirming details",
      boolean: true
    })
    .run(async ({ args, flags, props }) => {
      const { config, Punch } = props;

      const project = config.projects[args.project];
      if (!project) {
        throw new Error("Project is not in your config file");
      }

      const active = await Punch.current();

      if (active && active.project === project) {
        return console.log(
          `You're currently punched in on ${getLabelFor(
            config,
            active.project
          )}. Punch out before creating an invoice.`
        );
      }

      const startDate = flags["start-date"];
      const endDate = flags["end-date"];
      const outputFile = flags["output-file"];

      if (!project.hourlyRate) {
        console.log(`${getLabelFor(config, project)} has no hourly rate set}`);
        return;
      }

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      let fileFormat;

      if (flags.format) {
        fileFormat = flags.format;
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
            return console.log(
              `Exporting invoices as ${ext.toLowerCase()} is not yet supported. Use HTML or PDF.`
            );
          default:
            return console.log(
              `Can't export to file with an extension of ${ext}`
            );
        }
      }

      console.log(
        "\n" +
          labelTable([
            { label: "Project", value: project.name },
            {
              label: "Start Date",
              value: formatDate(startDate, config.display.dateFormat)
            },
            {
              label: "End Date",
              value: formatDate(endDate, config.display.dateFormat)
            },
            { label: "Invoice Format", value: fileFormat },
            { label: "Output To", value: resolvePath(outputFile) }
          ])
      );

      if (flags.yes || confirm("Create invoice?")) {
        const loader = Loader({ text: "Generating invoice..." });
        loader.start();

        const invoicer = Invoicer(config);
        const punches = await Punch.select(
          p =>
            p.project === project.alias &&
            p.in.getTime() >= startDate.getTime() &&
            p.in.getTime() <= endDate.getTime()
        );

        try {
          await invoicer.generate(
            {
              project,
              start: startDate,
              end: endDate,
              today: new Date(),
              punches,
              user: config.user,
              output: {
                path: resolvePath(outputFile),
                format: fileFormat,
                customFormat: !!flags.format
              }
            },
            false
          );
          loader.stop(`${fileFormat} invoice generated!`);
        } catch (err) {
          loader.stop(
            `There was an error while generating the invoice: ${err.message}`
          );
        }
      }
    });
