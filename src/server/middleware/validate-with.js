/**
 * Validates the incoming request body against a Joi schema.
 */
module.exports = schema => (req, res, next) => {
  const { error } = schema.validate(req.body);

  if (error) {
    const errors = error.details.map(entry => ({
      message: entry.message,
      value: entry.context.value
    }));

    return res.status(400).json({
      data: {
        errors
      }
    });
  }

  next();
};
