const joi = require("@hapi/joi");

const punchSchema = joi.object({
  id: joi.string().guid(),
  project: joi.string(),
  in: joi.number(),
  out: joi.number().allow(null),
  rate: joi.number(),
  comments: joi.array().items(
    joi.object({
      comment: joi.string(),
      timestamp: joi.number()
    })
  ),
  created: joi.number(),
  updated: joi.number()
});

module.exports = joi.object({
  punches: joi.array().items(punchSchema)
});
