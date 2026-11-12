// controllers/gameController.js
// -------------------------------------------------------------
// CONTROLLER LAYER: receives the (already validated) request, asks the service
// for data, processes it (filter, sort, count, paginate) and chooses the EJS view.
// -------------------------------------------------------------
const gameService = require('../services/freeToGameService');

const PAGE_SIZE = 12; // cards per page
const FEATURED_COUNT = 8; // cards on the home page

// ---------- Helper functions (data processing) ----------

// CALCULATE: simple statistics about the found games
function calculateStats(games) {
  if (games.length === 0) return null;

  // ISO dates ("2022-10-04") sort correctly as plain strings
  const dates = games.map((g) => g.releaseDate).filter(Boolean).sort();

  return {
    total: games.length,
    newest: dates.length ? gameService.formatDate(dates[dates.length - 1]) : 'Unknown',
    oldest: dates.length ? gameService.formatDate(dates[0]) : 'Unknown',
    publishers: new Set(games.map((g) => g.publisher)).size
  };
}

// Builds a link such as /games?category=shooter&platform=pc&page=2
function buildPageUrl(path, filters, page) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', filters.category);
  if (filters.platform && filters.platform !== 'all') params.set('platform', filters.platform);
  if (filters.sort && filters.sort !== 'popularity') params.set('sort', filters.sort);
  if (page > 1) params.set('page', page);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

// ---------- Route handlers ----------

// GET /  -> home page with popular games
async function showHome(req, res, next) {
  try {
    let featured = [];
    let warning = null;

    // If the API fails, the home page should still open, so we catch the error here
    try {
      const games = await gameService.getGames({ sort: 'popularity' });
      featured = games.slice(0, FEATURED_COUNT);
    } catch (apiError) {
      warning = apiError.message || 'We could not load popular games right now.';
    }

    res.render('home', { title: 'Home', featured, warning });
  } catch (err) {
    next(err); // unexpected problem -> central error handler
  }
}

// GET /games  and  GET /search  -> list of games (the same view is reused)
async function listGames(req, res, next) {
  try {
    const { category, platform, sort, q, page } = req.cleanQuery; // set by validateGameQuery

    // 1) Ask the API (category / platform / sort are handled by the API itself)
    let games = await gameService.getGames({ category, platform, sort });

    // 2) FILTER by title on the server (the API has no search endpoint)
    if (q) {
      const needle = q.toLowerCase();
      games = games.filter((game) => game.title.toLowerCase().includes(needle));
    }

    // 3) CALCULATE statistics
    const stats = calculateStats(games);

    // 4) Paginate (show only one page of cards)
    const totalPages = Math.max(1, Math.ceil(games.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = games.slice(start, start + PAGE_SIZE);

    const filters = { category, platform, sort, q };

    const pagination = {
      page: currentPage,
      totalPages,
      prevUrl: currentPage > 1 ? buildPageUrl(req.path, filters, currentPage - 1) : null,
      nextUrl: currentPage < totalPages ? buildPageUrl(req.path, filters, currentPage + 1) : null
    };

    res.render('games', {
      title: q ? `Search: ${q}` : 'Games',
      games: pageItems,
      errors: [],
      filters,
      stats,
      pagination,
      totalFound: games.length
    });
  } catch (err) {
    next(err);
  }
}

// GET /game/:id  -> details of one game
async function showGame(req, res, next) {
  try {
    const game = await gameService.getGameById(req.gameId); // set by validateGameId
    res.render('game', { title: game.title, game });
  } catch (err) {
    next(err);
  }
}

module.exports = { showHome, listGames, showGame };
