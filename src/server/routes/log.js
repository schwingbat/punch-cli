const route = require("express").Router();
const { ascendingBy, descendingBy } = require("../../utils/sort-factories");
const is = require("@schwingbat/is");
const moment = require("moment-timezone");

const dateFormat = "YYYY-MM-DD";

route.get("/", async function (req, res) {
  const page = Number(req.query.page || 1);
  const count = Math.min(Number(req.query.count || 25), 100);
  const projects = req.query.project
    ? req.query.project.split(",").map((p) => p.trim().toLowerCase())
    : null;
  const tags = req.query.tag
    ? req.query.tag.split(",").map((p) => p.trim().toLowerCase())
    : null;
  let start = req.query.start ? moment(req.query.start, dateFormat) : null;
  let end = req.query.end ? moment(req.query.end, dateFormat) : null;

  if (start) {
    if (start.isValid()) {
      start = start.startOf("day").toDate();
    } else {
      start = null;
    }
  }

  if (end) {
    if (end.isValid()) {
      end = end.endOf("day").toDate();
    } else {
      end = null;
    }
  }

  const { Punch, config } = req.props;

  const punches = await Punch.filter((punch) => {
    if (projects && !projects.includes(punch.project.toLowerCase())) {
      return false;
    }

    if (start) {
      if (punch.in < start) {
        return false;
      }
    }

    if (end) {
      if (punch.in > end) {
        return false;
      }
    }

    if (tags) {
      let hasTag = false;

      for (const tag of tags) {
        if (punch.hasCommentWithTag(tag)) {
          hasTag = true;
          break;
        }
      }

      if (!hasTag) {
        return false;
      }
    }

    return true;
  });

  punches.sort(descendingBy("in"));

  const slice = punches.slice((page - 1) * count, page * count);
  const groups = groupByDate(
    slice,
    config.display.timeZone,
    config.display.dateFormat
  );

  const totalPages = Math.ceil(punches.length / count);

  let filtersUrl = "/log/filters";
  let tagsUrl = "/log/tags";
  let backUrl = page > 1 ? `/log?page=${page - 1}` : null;
  let nextUrl = page < totalPages ? `/log?page=${page + 1}` : null;

  let query = encodeQuery(req.query, [
    "count",
    "project",
    "tag",
    "start",
    "end",
  ]);

  if (query !== "") {
    filtersUrl += "?" + query;
    tagsUrl += "?" + query;

    if (backUrl) {
      backUrl += "&" + query;
    }

    if (nextUrl) {
      nextUrl += "&" + query;
    }
  }

  const filters = {
    start,
    end,
    projects,
    tags,
    any: (start || end || projects || tags) && true,
  };

  res.render("sections/log/index", {
    groups,
    totalResults: punches.length,
    filtersUrl,
    tagsUrl,
    filters,
    pagination: {
      currentPage: page,
      totalPages,
      count,
      backUrl,
      nextUrl,
    },
  });
});

/**
 * Route to view and edit filters.
 */
route.get("/filters", async (req, res) => {
  res.render("sections/log/filters", {
    project: req.query.project || "",
    tag: req.query.tag || "",
    start: req.query.start || "",
    end: req.query.end || "",
  });
});

/**
 * Redirect back to log page with new filter settings.
 */
route.post("/filters", async (req, res) => {
  console.log(req.body);

  let start, end;

  if (
    req.body["start-date-year"] &&
    req.body["start-date-month"] &&
    req.body["start-date-day"]
  ) {
    const date = moment(
      [
        req.body["start-date-year"],
        req.body["start-date-month"],
        req.body["start-date-day"],
      ].join("-"),
      dateFormat
    );

    if (date.isValid()) {
      start = date.format(dateFormat);
    }
  }

  if (
    req.body["end-date-year"] &&
    req.body["end-date-month"] &&
    req.body["end-date-day"]
  ) {
    const date = moment(
      [
        req.body["end-date-year"],
        req.body["end-date-month"],
        req.body["end-date-day"],
      ].join("-"),
      dateFormat
    );

    if (date.isValid()) {
      end = date.format(dateFormat);
    }
  }

  let url = "/log";
  let query = encodeQuery(
    {
      ...req.query,
      ...req.body,
      start,
      end,
    },
    ["count", "project", "tag", "page", "start", "end"]
  );

  if (query !== "") {
    url += "?" + query;
  }

  res.redirect(url);
});

/**
 * Index of tags in all punches. Alphabetized and linky for
 * your clicking pleasure.
 */
route.get("/tags", async (req, res) => {
  const { Punch } = req.props;

  const tags = {};

  const punches = await Punch.all();
  for (const punch of punches) {
    for (const comment of punch.comments) {
      for (const tag of comment.tags) {
        if (!tags[tag.string]) {
          tags[tag.string] = {
            url:
              "/log?" +
              encodeQuery({
                ...req.query,
                tag: tag.string,
              }),
            label: "#" + tag.string,
            sortKey: tag.string.toLowerCase(),
          };
        }
      }
    }
  }

  res.render("sections/log/tags", {
    tags: Object.values(tags).sort(ascendingBy("sortKey")),
  });
});

module.exports = route;

function groupByDate(punches, timeZone, dateFormat = "ddd, MMM D, Y") {
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
      title: date.format(dateFormat),
      punches: groups[key].sort(ascendingBy("in")),
    });
  }

  return groupsArray;
}

function encodeQuery(obj, allowedKeys = null) {
  let pairs = [];

  const allowed = allowedKeys && allowedKeys.map((k) => k.toLowerCase().trim());

  for (const key in obj) {
    if (allowed && !allowed.includes(key.toLowerCase())) {
      continue;
    }

    if (!obj[key]) {
      continue;
    }

    const type = is.what(obj[key]);
    let value;

    switch (type) {
      case "array":
        value = obj[key].join(",");
        break;
      case "number":
        value = obj[key].toString();
        break;
      default:
        value = obj[key];
        break;
    }

    pairs.push(`${key}=${value}`);
  }

  return pairs.join("&");
}
