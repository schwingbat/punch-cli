const route = require("express").Router();

const validateWith = require("../../../../middleware/validate-with");
const uploadSchema = require("./schema/upload");
const downloadSchema = require("./schema/download");
const deleteSchema = require("./schema/delete");

/**
 * Get a mapping of all punch IDs and the dates they were last modified on this server.
 */
route.get("/manifest", async (req, res) => {
  const { Punch } = req.props;

  let manifest = {};
  const punches = await Punch.all();

  for (const punch of punches) {
    manifest[punch.id] = punch.updated.getTime();
  }

  return res.json({
    data: manifest
  });
});

/**
 * Take an array of punches and store them locally.
 */
route.post("/upload", validateWith(uploadSchema), async (req, res) => {
  const { Punch, events } = req.props;
  const { punches } = req.body;

  for (const data of punches) {
    const existing = await Punch.find(p => p.id === data.id);
    let punch;

    if (existing) {
      punch = new Punch({
        ...existing.toJSON(),
        ...data
      });
    } else {
      punch = new Punch(data);
    }

    await punch.save();
  }

  events.emit("server:punchupdated");

  return res.status(204).send();
});

/**
 * Send back full punch data for each ID.
 */
route.post("/download", validateWith(downloadSchema), async (req, res) => {
  const { Punch } = req.props;
  const { ids } = req.body;

  const map = {};
  for (const id of ids) {
    map[id] = true;
  }

  const punches = await Punch.filter(punch => map[punch.id]);

  return res.json({
    data: {
      punches
    }
  });
});

/**
 * Delete any punches with matching IDs.
 */
route.post("/delete", validateWith(deleteSchema), async (req, res) => {
  const { Punch, events } = req.props;
  const { ids } = req.body;

  const map = {};
  for (const id of ids) {
    map[id] = true;
  }

  const punches = await Punch.filter(punch => map[punch.id]);

  for (const punch of punches) {
    await punch.delete();
  }

  events.emit("server:punchupdated");

  return res.status(204).send();
});

module.exports = route;
