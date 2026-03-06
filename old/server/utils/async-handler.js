/**
 * Wraps an async express handler so uncaught promise rejections
 * are forwarded to express's error middleware instead of crashing.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
