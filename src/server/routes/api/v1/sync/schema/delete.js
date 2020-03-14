const joi = require("@hapi/joi");

module.exports = joi.object({
  ids: joi.array().items(joi.string().guid())
});
