// middleware/logger.js
// CUSTOM MIDDLEWARE #1: request logger.
// Prints: time, HTTP method, URL, status code and how long the request took.
// Example: [2026-11-05T10:15:30.123Z] GET /games?category=shooter 200 85ms

function logger(req, res, next) {
  const start = Date.now();

  // "finish" fires when the response has been sent, so the status code is known by then
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
  });

  next(); // pass control to the next middleware
}

module.exports = logger;
