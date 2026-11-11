// middleware/validateGameQuery.js
// CUSTOM MIDDLEWARE #2: validates the query string of /games and /search
// BEFORE any request is sent to the external API.
//
// It is a "middleware factory": calling validateGameQuery({ requireSearchText: true })
// returns the real middleware function. This lets us reuse the same code for two routes.
//
// If everything is valid, the cleaned values are stored in req.cleanQuery.
// If something is wrong, we render the games page again with error messages (status 400).

const { CATEGORIES, PLATFORMS, SORT_OPTIONS } = require('../config/options');

// Letters (any language), digits, spaces and a few common symbols
const SEARCH_TEXT_PATTERN = /^[\p{L}\p{N} :'\-.!&,]+$/u;
const MAX_SEARCH_LENGTH = 50;

function validateGameQuery({ requireSearchText = false } = {}) {
  return function (req, res, next) {
    const errors = [];

    // Read and tidy the raw values (default to an empty string if missing)
    const category = String(req.query.category || '').trim().toLowerCase();
    const platform = String(req.query.platform || 'all').trim().toLowerCase();
    const sort = String(req.query.sort || 'popularity').trim().toLowerCase();
    const q = String(req.query.q || '').trim();
    const pageRaw = req.query.page === undefined ? '1' : String(req.query.page);

    // category is optional, but if present it must be in our list
    if (category && !CATEGORIES.some((c) => c.value === category)) {
      errors.push('Please choose a category from the list.');
    }

    if (!PLATFORMS.some((p) => p.value === platform)) {
      errors.push('Please choose a valid platform (All, PC or Web Browser).');
    }

    if (!SORT_OPTIONS.some((s) => s.value === sort)) {
      errors.push('Please choose a valid sort order.');
    }

    // Search text checks
    if (requireSearchText && q === '') {
      errors.push('Please type a game title to search for.');
    }
    if (q.length > MAX_SEARCH_LENGTH) {
      errors.push(`The search text must be at most ${MAX_SEARCH_LENGTH} characters long.`);
    } else if (q !== '' && !SEARCH_TEXT_PATTERN.test(q)) {
      errors.push('The search text contains characters that are not allowed.');
    }

    // page must be a whole number >= 1
    const page = Number(pageRaw);
    if (!Number.isInteger(page) || page < 1) {
      errors.push('The page number must be a positive whole number.');
    }

    if (errors.length > 0) {
      // Show the form again with the problems listed
      return res.status(400).render('games', {
        title: 'Check your input',
        games: [],
        errors,
        filters: { category: '', platform: 'all', sort: 'popularity', q: '' },
        stats: null,
        pagination: null,
        totalFound: 0
      });
    }

    req.cleanQuery = { category, platform, sort, q, page };
    next();
  };
}

module.exports = validateGameQuery;
