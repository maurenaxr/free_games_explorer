// middleware/notFound.js
// 404 handler. It is registered AFTER all routes in app.js,
// so it only runs when no route matched the URL.

const AppError = require('../utils/AppError');

function notFound(req, res, next) {
  next(new AppError(404, 'The page you are looking for does not exist.'));
}

module.exports = notFound;
