// routes/gameRoutes.js
// ROUTES: connect a URL + HTTP method to middleware and a controller function.
// The routes contain no logic; the work is done in the middleware and the controller.

const express = require('express');
const controller = require('../controllers/gameController');
const validateGameQuery = require('../middleware/validateGameQuery');
const validateGameId = require('../middleware/validateGameId');

const router = express.Router();

// Home page
router.get('/', controller.showHome);

// List of games filtered by category / platform / sort (search text is optional)
router.get('/games', validateGameQuery(), controller.listGames);

// Search by title (the search text is required)
router.get('/search', validateGameQuery({ requireSearchText: true }), controller.listGames);

// Details of one game
router.get('/game/:id', validateGameId, controller.showGame);

module.exports = router;
