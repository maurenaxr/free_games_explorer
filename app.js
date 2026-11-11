// app.js
// Entry point: creates the Express app, registers middleware and routes, starts the server.
// Order matters in Express: middleware runs in the order it is registered.

// 1) Load .env FIRST, so process.env is ready for all files required below
require('dotenv').config();

const path = require('path');
const express = require('express');

const logger = require('./middleware/logger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const gameRoutes = require('./routes/gameRoutes');
const { CATEGORIES, PLATFORMS, SORT_OPTIONS } = require('./config/options');

const app = express();
const PORT = process.env.PORT || 3000;

// 2) View engine: render .ejs files from the "views" folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 3) Middleware
app.use(logger); // custom: logs every request
app.use(express.static(path.join(__dirname, 'public'))); // built-in: serves css/images
app.use(express.urlencoded({ extended: true })); // built-in: reads HTML form data
app.use(express.json()); // built-in: reads JSON bodies

// Values available in EVERY EJS view (no need to pass them from each controller)
app.use((req, res, next) => {
  res.locals.categories = CATEGORIES;
  res.locals.platforms = PLATFORMS;
  res.locals.sortOptions = SORT_OPTIONS;
  res.locals.currentYear = new Date().getFullYear();
  next();
});

// 4) Routes
app.use('/', gameRoutes);

// 5) 404 handler: runs only if no route above matched
app.use(notFound);

// 6) Central error handler: MUST be last
app.use(errorHandler);

// Safety net: log unexpected problems instead of crashing silently
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled promise rejection]', reason);
});

app.listen(PORT, () => {
  console.log(`Free Games Explorer is running at http://localhost:${PORT}`);
});
