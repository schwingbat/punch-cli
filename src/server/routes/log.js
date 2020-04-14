const route = require("express").Router();
const { ascendingBy, descendingBy } = require("../../utils/sort-factories");
const format = require("date-fns/format");
const moment = require("moment-timezone");

route.get("/", async function (req, res) {
  const page = Number(req.query.page || 1);
  const count = Number(req.query.count || 100);

  const { Punch, config } = req.props;

  const punches = (await Punch.all()).sort(descendingBy("in"));

  const slice = punches.slice((page - 1) * count, page * count);
  const groups = groupByDate(slice, config.display.timeZone);

  const totalPages = Math.ceil(punches.length / count);
  const countQuery = req.query.count ? `&count=${req.query.count}` : "";

  const backUrl = page > 1 ? `/log?page=${page - 1}${countQuery}` : null;
  const nextUrl =
    page < totalPages ? `/log?page=${page + 1}${countQuery}` : null;

  res.render("sections/log/index", {
    groups,
    pagination: {
      currentPage: page,
      totalPages,
      count,
      backUrl,
      nextUrl
    }
  });
});

module.exports = route;

function groupByDate(punches, timeZone) {
  const groups = {};

  for (const punch of punches) {
    
    const key = moment(punch.in).tz(timeZone).format("Y-MM-DD");
    
    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(punch);
  }

  const groupsArray = [];

  for (const key in groups) {
    const date = moment(groups[key][0].in).tz(timeZone);

    groupsArray.push({
      title: date.format("ddd, MMM D, Y"),
      punches: groups[key].sort(ascendingBy("in"))
    });
  }

  return groupsArray;
}
