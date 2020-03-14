/**
 * Only allows requests through if they have an Authorization header with a Bearer token
 * matching one of the server.api.accessTokens values in punchconfig.json.
 */

module.exports = options => {
  const tokens = [];

  if (options.token) {
    tokens.push(options.token);
  }

  if (options.tokens) {
    tokens.push(...options.tokens);
  }

  return (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        data: {
          errors: [
            {
              message: "Missing 'Authorization' header."
            }
          ]
        }
      });
    }

    const value = token.replace(/^bearer /i, "");

    if (!tokens.includes(value)) {
      if (!token) {
        return res.status(403).json({
          data: {
            errors: [
              {
                message:
                  "'Authorization' header does not match any valid tokens."
              }
            ]
          }
        });
      }
    }

    return next();
  };
};
