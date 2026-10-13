module.exports = (schema, property = 'body') => {
  return (req, res, next) => {
    const data = req[property];

    const { error } = schema.validate(data, {
      abortEarly: false,
      allowUnknown: true
    });

    if (error) {
      const err = new Error(
        error.details.map(d => d.message).join(', ')
      );
      err.statusCode = 400;
      return next(err);
    }

    next();
  };
};
