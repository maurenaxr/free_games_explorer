// utils/AppError.js
// A small custom error class.
// It carries an HTTP status code and a friendly message that is safe to show to the user.
// The central error handler (middleware/errorHandler.js) reads these two fields.

class AppError extends Error {
  /**
   * @param {number} status   HTTP status code, e.g. 400, 404, 502
   * @param {string} message  Friendly text shown to the user
   */
  constructor(status, message) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.expose = true; // true = the message is safe to show in the browser
  }
}

module.exports = AppError;
