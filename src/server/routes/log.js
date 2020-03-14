const route = require("express").Router();
const { ascendingBy, descendingBy } = require("../../utils/sort-factories");
const format = require("date-fns/format");

route.get("/", async function(req, res) {
  const page = Number(req.query.page || 1);
  const count = Number(req.query.count || 100);

  const { Punch } = req.props;

  const punches = (await Punch.all()).sort(descendingBy("in"));

  const slice = punches.slice((page - 1) * count, page * count);
  const groups = groupByDate(slice);

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

function groupByDate(punches) {
  const groups = {};

  for (const punch of punches) {
    let y = punch.in.getFullYear();
    let m = punch.in.getMonth();
    let d = punch.in.getDate();

    const key = `${y}-${m}-${d}`;

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(punch);
  }

  const groupsArray = [];

  for (const key in groups) {
    const date = groups[key][0].in;

    groupsArray.push({
      title: format(date, "eee, MMM d, yyyy"),
      punches: groups[key].sort(ascendingBy("in"))
    });
  }

  return groupsArray;
}
