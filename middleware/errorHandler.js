// middleware/errorHandler.js
// CENTRALIZED ERROR HANDLER.
// Express recognises it as an error handler because it has FOUR parameters (err, req, res, next).
// It must be registered LAST in app.js.
// Anything passed to next(err) anywhere in the app ends up here.

function errorHandler(err, req, res, next) {
  // If a response has already started, we cannot render a new page: let Express finish
  if (res.headersSent) {
    return next(err);
  }

  // Technical details go to the console only
  console.error(`[Error] ${req.method} ${req.originalUrl}`, err);

  const status = err.status || 500;

  // Show our own friendly message for AppError, a generic one for unexpected bugs
  const message = err.expose
    ? err.message
    : 'Something went wrong on our side. Please try again later.';

  res.status(status).render('error', {
    title: `Error ${status}`,
    status,
    message
  });
}

module.exports = errorHandler;
