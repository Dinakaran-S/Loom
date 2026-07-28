// Wraps async route handlers so a thrown/rejected error is forwarded to
// the centralized error middleware instead of crashing the process.
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
