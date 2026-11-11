// middleware/validateGameId.js
// CUSTOM MIDDLEWARE #3: checks that :id in /game/:id is a positive whole number.
// If not, we create an AppError and send it to the central error handler with next(err).

const AppError = require('../utils/AppError');

function validateGameId(req, res, next) {
  const id = req.params.id;

  // /^\d+$/ means "digits only"; this also rejects things like "12abc" or "-5"
  if (!/^\d+$/.test(id) || Number(id) < 1) {
    return next(new AppError(400, 'The game ID must be a positive number.'));
  }

  req.gameId = Number(id);
  next();
}

module.exports = validateGameId;
