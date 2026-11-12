// services/freeToGameService.js
// -------------------------------------------------------------
// SERVICE LAYER: the only file that talks to the external API.
// Controllers call the functions exported here and never use Axios directly.
// -------------------------------------------------------------
const axios = require('axios');
const AppError = require('../utils/AppError');

// One Axios instance with shared settings (base URL and timeout).
// The timeout makes sure the server does not wait forever if the API is slow.
const client = axios.create({
  baseURL: process.env.API_BASE_URL || 'https://www.freetogame.com/api',
  timeout: Number(process.env.REQUEST_TIMEOUT_MS) || 10000,
  headers: { Accept: 'application/json' }
});

// ---------- Simple in-memory cache ----------
// The API returns hundreds of games, and the same request is often repeated.
// We keep each answer for a few minutes so we send fewer requests to the API.
const cache = new Map();
const CACHE_TTL_MS = (Number(process.env.CACHE_TTL_SECONDS) || 300) * 1000;

async function cachedGet(path, params) {
  const key = path + JSON.stringify(params);
  const hit = cache.get(key);

  if (hit && Date.now() - hit.time < CACHE_TTL_MS) {
    return hit.data; // still fresh, no HTTP request needed
  }

  const response = await client.get(path, { params }); // real request with Axios
  cache.set(key, { data: response.data, time: Date.now() });
  return response.data;
}

// ---------- Error translation ----------
// Turns any Axios error into an AppError with a friendly message.
// Technical details are written to the console only (never shown to the user).
function toAppError(error) {
  console.error('[FreeToGame API error]', {
    message: error.message,
    code: error.code,
    status: error.response && error.response.status,
    url: error.config && error.config.url,
    params: error.config && error.config.params
  });

  // Not an Axios error (a bug in our own code): generic message
  if (!error.isAxiosError) {
    return new AppError(500, 'Something went wrong while loading the games. Please try again.');
  }

  // Timeout
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new AppError(504, 'The games service is taking too long to respond. Please try again in a moment.');
  }

  // The API answered, but with an error status code
  if (error.response) {
    const status = error.response.status;
    if (status === 401 || status === 403) {
      return new AppError(502, 'The games service refused our request (access denied).');
    }
    if (status === 404) {
      return new AppError(404, 'The requested data was not found.');
    }
    if (status === 429) {
      return new AppError(429, 'Too many requests were sent to the games service. Please wait a minute and try again.');
    }
    if (status >= 500) {
      return new AppError(502, 'The games service is having problems right now. Please try again later.');
    }
    return new AppError(502, 'The games service could not process this request.');
  }

  // No answer at all: network problem, DNS error, etc.
  return new AppError(503, 'We cannot reach the games service. Please check your internet connection and try again.');
}

// ---------- Data helpers ----------

// "2022-10-04" -> "October 4, 2022"
function formatDate(isoDate) {
  if (!isoDate) return 'Unknown';
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

// SELECT only the fields that the views need (we do not pass the whole JSON along).
function simplifyGame(game) {
  return {
    id: game.id,
    title: game.title || 'Untitled',
    thumbnail: game.thumbnail,
    shortDescription: game.short_description || '',
    genre: game.genre || 'Unknown',
    platform: game.platform || 'Unknown',
    publisher: game.publisher || 'Unknown',
    developer: game.developer || 'Unknown',
    releaseDate: game.release_date || '',
    releaseDateFormatted: formatDate(game.release_date),
    gameUrl: game.game_url,
    profileUrl: game.freetogame_profile_url
  };
}

// Extra fields that only exist in the "details" answer.
function simplifyGameDetails(game) {
  const reqs = game.minimum_system_requirements || null;

  // Build the requirements object only if at least one value is present
  let requirements = null;
  if (reqs && Object.values(reqs).some(Boolean)) {
    requirements = {
      os: reqs.os,
      processor: reqs.processor,
      memory: reqs.memory,
      graphics: reqs.graphics,
      storage: reqs.storage
    };
  }

  return {
    ...simplifyGame(game),
    description: game.description || game.short_description || '',
    status: game.status || 'Unknown',
    screenshots: Array.isArray(game.screenshots) ? game.screenshots.map((s) => s.image) : [],
    requirements
  };
}

// ---------- Public functions used by the controllers ----------

/**
 * REQUEST 1: GET /games  (list of games)
 * Optional filters: category, platform ("pc" / "browser"), sort ("popularity", ...)
 * Returns an array of simplified games (empty array if nothing was found).
 */
async function getGames({ category, platform, sort } = {}) {
  const params = {};
  if (category) params.category = category;
  if (platform && platform !== 'all') params.platform = platform;
  if (sort) params['sort-by'] = sort;

  try {
    const data = await cachedGet('/games', params);
    // When nothing matches, the API may return an object instead of an array
    if (!Array.isArray(data)) return [];
    return data.map(simplifyGame);
  } catch (error) {
    // 404 here simply means "no games found", it is not a real failure
    if (error.response && error.response.status === 404) return [];
    throw toAppError(error);
  }
}

/**
 * REQUEST 2: GET /game?id=...  (details of one game)
 * Returns one simplified game with description, screenshots and requirements.
 */
async function getGameById(id) {
  try {
    const data = await cachedGet('/game', { id });
    if (!data || data.status === 0) {
      throw new AppError(404, 'We could not find a game with that ID.');
    }
    return simplifyGameDetails(data);
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error.response && error.response.status === 404) {
      throw new AppError(404, 'We could not find a game with that ID.');
    }
    throw toAppError(error);
  }
}

module.exports = { getGames, getGameById, formatDate };
