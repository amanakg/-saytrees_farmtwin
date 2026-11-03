module.exports = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      const err = new Error('API Key is required');
      err.statusCode = 401;
      throw err;
    }

    if (apiKey !== process.env.API_SECRET_KEY) {
      const err = new Error('Invalid API Key');
      err.statusCode = 403;
      throw err;
    }

    next();
  } catch (err) {
    next(err);
  }
};
