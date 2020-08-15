const route = require("express").Router();
const moment = require("moment");
const parseDateTime = require("../../utils/parse-datetime");

// ----- Punching In & Out ----- //

// Show punch setup page
route.get("/in", async function (req, res) {
  const { Punch } = req.props;
  const { projects } = req.props.config;

  const now = new Date();

  const latestPunches = await Promise.all(
    Object.keys(projects).map((alias) => Punch.latest(alias))
  );

  latestPunches.sort((a, b) => {
    const left = a.out || now;
    const right = b.out || now;

    if (left > right) {
      return -1;
    } else if (left < right) {
      return 1;
    } else {
      return 0;
    }
  });

  const activeProjects = latestPunches
    .filter((p) => moment(now).diff(p.out || now, "months") < 6)
    .map((p) => ({
      ...projects[p.project],
      isActive: p.out == null,
    }));

  const inactiveProjects = latestPunches
    .filter((p) => moment(now).diff(p.out || now, "months") >= 6)
    .map((p) => ({
      ...projects[p.project],
      isActive: p.out == null,
    }));

  const recentProjects = activeProjects.slice(0, 3);

  res.render("sections/punch/track/in", {
    recentProjects,
    activeProjects,
    inactiveProjects,
    returnUrl: req.query.r,
  });
});

route.get("/in/:project", async function (req, res) {
  const { Punch } = req.props;
  const { projects } = req.props.config;
  const { project } = req.params;

  if (projects[project]) {
    const now = moment();

    const defaultDate = now.format("YYYY-MM-DD");
    const defaultTime = now.format("HH:mm");

    res.render("sections/punch/track/in-confirm", {
      project: projects[project],
      activePunch: await Punch.current(project),
      defaultDate,
      defaultTime,
    });
  } else {
    // TODO: Render 404
  }
});

// Create the punch
route.post("/in/:project", async function (req, res) {
  const { Punch, events } = req.props;
  const { project } = req.params;

  const punch = new Punch({
    project,
    in: new Date(),
  });

  await punch.save();
  events.emit("server:punchupdated");

  return res.redirect("/");
});

// Show punch out page
route.get("/out/:id", async function (req, res) {
  const { Punch, config } = req.props;

  const now = moment();
  const punch = await Punch.find((p) => p.id === req.params.id);

  const defaultDate = req.query.date || now.format("YYYY-MM-DD");
  const defaultTime = req.query.time || now.format("HH:mm");

  return res.render("sections/punch/track/out", {
    id: req.params.id,
    project: config.projects[punch.project],
    defaultDate,
    defaultTime,
    returnUrl: req.query.r,
  });
});

// Punch out
route.post("/out/:id", async function (req, res) {
  // TODO: End punch and redirect to punch details
  const { body } = req;
  const { Punch, events, config } = req.props;
  const { id } = req.params;

  let timestamp = new Date();

  if (body["custom-timestamp"] === "on") {
    const date =
      body["end-date-year"] +
      "-" +
      body["end-date-month"] +
      "-" +
      body["end-date-day"];
    const time = body["end-time-hour"] + ":" + body["end-time-minute"];

    const m = moment.tz(date + " " + time, config.display.timeZone);

    if (m.isValid()) {
      timestamp = m.toDate();
    } else {
      // TODO: return flash error
      return res.redirect(
        "/punch/out/" + id + "?date=" + date + "&time=" + time
      );
    }
  }

  const comment = body.comment.trim() != "" ? body.comment : null;
  const punch = await Punch.find((p) => p.id === id);

  if (punch) {
    await punch.punchOut(comment, {
      time: timestamp,
      autosave: true,
    });
    events.emit("server:punchupdated");

    return res.redirect("/");
  }

  // TODO: Show 404
});

// ----- Details ----- //

route.get("/:id", async function (req, res) {
  const { id } = req.params;
  const { config, Punch } = req.props;

  const punch = await Punch.find((p) => p.id === id);
  const project = config.projects[punch.project];

  const isActive = punch.out == null;
  const isPaid = punch.rate > 0;
  const earnings = punch.pay();

  res.render("sections/punch/show", {
    punch,
    project,
    isActive,
    isPaid,
    earnings,
    returnUrl: req.query.r,
  });
});

// ----- Delete ----- //

route.get("/:id/delete", async function (req, res) {
  const { id } = req.params;
  const { config, Punch } = req.props;

  const punch = await Punch.find((p) => p.id === id);

  if (punch) {
    const project = config.projects[punch.project];

    return res.render("sections/punch/delete", {
      id,
      punch,
      project,
      returnUrl: req.query.r,
    });
  }

  // TODO: Render 404
});

route.post("/:id/delete", async function (req, res) {
  const { id } = req.params;
  const { Punch, events } = req.props;

  const punch = await Punch.find((p) => p.id === id);

  if (punch) {
    await punch.delete();
    events.emit("server:punchupdated");

    return res.redirect("/");
  }

  // TODO: Render 404
});

// ----- Comments ----- //

// Show text editor to enter comment
route.get("/:punchId/comment/new", async function (req, res) {
  res.render("sections/punch/comment/new", {
    punchId: req.params.punchId,
    returnUrl: req.query.r,
  });
});

// Add the comment
route.post("/:punchId/comment/new", async function (req, res) {
  const { body, params, props } = req;
  const { punchId } = params;
  const { comment } = body;
  const { Punch, events } = props;

  const punch = await Punch.find((p) => p.id === punchId);

  if (punch) {
    punch.addComment(comment);

    await punch.save();
    events.emit("server:punchupdated");

    return res.redirect(`/punch/${punchId}`);
  }

  // TODO: Render 404
});

// Show editor to update comment
route.get("/:punchId/comment/:commentId/edit", async function (req, res) {
  const { punchId, commentId } = req.params;
  const { Punch } = req.props;

  const punch = await Punch.find((p) => p.id === punchId);

  if (punch) {
    const comment = punch.comments.find((c) => c.id === commentId);

    if (comment) {
      return res.render("sections/punch/comment/edit", {
        punchId,
        commentId,
        comment: comment.comment,
        returnUrl: req.query.r,
      });
    }
  }

  // TODO: Render 404
});

// Update the comment
route.post("/:punchId/comment/:commentId/edit", async function (req, res) {
  const { punchId, commentId } = req.params;
  const { Punch, events } = req.props;
  const { body } = req;

  const punch = await Punch.find((p) => p.id === punchId);

  if (punch) {
    const comment = punch.comments.find((c) => c.id === commentId);

    if (comment) {
      comment.comment = body.comment;

      if (body.keepTimestamp != "on") {
        comment.timestamp = new Date();
      }
    }

    await punch.save();
    events.emit("server:punchupdated");
  }

  return res.redirect(`/punch/${punchId}`);
});

// Show delete confirmation page
route.get("/:punchId/comment/:commentId/delete", async function (req, res) {
  res.render("sections/punch/comment/delete", {
    returnUrl: req.query.r,
  });
});

// Actually delete the comment
route.post("/:punchId/comment/:commentId/delete", async function (req, res) {
  const { punchId, commentId } = req.params;
  const { Punch, events } = req.props;

  const punch = await Punch.find((p) => p.id === punchId);

  if (punch) {
    punch.deleteComment(commentId);

    await punch.save();
    events.emit("server:punchupdated");

    return res.redirect(`/punch/${punchId}`);
  }

  // TODO: Render 404
});

module.exports = route;
