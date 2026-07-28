const { ValidationError } = require("../utils/errors");

// validate({ body: schema, query: schema, params: schema })
function validate(schemas) {
  return (req, res, next) => {
    for (const key of ["body", "query", "params"]) {
      const schema = schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(req[key]);
      if (!result.success) {
        const details = result.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        return next(new ValidationError("Invalid request", details));
      }
      req[key] = result.data; // use parsed/coerced values downstream
    }
    next();
  };
}

module.exports = validate;
