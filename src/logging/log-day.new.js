function t() {}

module.exports = async function({
  config,
  punches,
  date,
  summary,
  project,
  interval
}) {
  const { template } = require("../printing")(config);

  // console.log("TEST", summary);

  console.log(
    await template("day-punches", {
      date,
      punches,
      summary
    })
  );

  t(date)
    .date()
    .bold()
    .underlined()
    .break();

  for (const punch in punches) {
    t.indent(3);

    t(punch.in)
      .time()
      .padStart(8)
      .append(" - ")
      .write();
  }

  let table = t.table();

  table
    .header()
    .column("Project")
    .column("Time")
    .column("Pay")
    .column("Punches");

  for (const project of summary) {
    table
      .row()
      .column(project.name)
      .column(
        t(project.time).duration({ resolution: "seconds", fractional: false })
      )
      .column(t(project.pay).currency())
      .column(() => {
        const { length } = project.punches;
        return `${length} ${length === 1 ? "punch" : "punches"}`;
      });
  }

  table.write();

  // {% import "_macros.njk" as m %}

  // {{ m.dayheader(date) }}
  // {% for punch in punches %}
  //   {% filter color("cyan" if punch.out else "green") -%}
  //       {{ punch.in|time|padstart(8)|append(" - ") }}

  //       {%- filter padstart(8) -%}
  //         {%- if punch.out != null -%}
  //             {{ punch.out|time }}
  //         {%- else -%}
  //             {{ "NOW" }}
  //         {%- endif -%}
  //       {%- endfilter %}
  //   {%- endfilter %}

  //   {{- punch.duration()|duration(resolution="hours", fractional=true)|padstart(6)|blue }}

  //   {{- (punch.project|projectconfig).name|prepend(" [")|append("] ")|yellow }}

  //   {%- for comment in punch.comments %}
  //       {{ "⸭"|dim }} {{ comment.timestamp|duration(resolution="minutes")|prepend("+")|append(":")|padstart(20)|cyan }} {{comment.comment|wrap(80, wrapTo=30)}}
  //   {%- endfor -%}
  // {%- endfor %}

  // {{ m.totals(summary) }}
};
