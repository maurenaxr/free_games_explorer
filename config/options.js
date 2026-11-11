// config/options.js
// Lists of values that the user is allowed to choose.
// They are used in two places:
//   1) to build the <select> elements in the EJS views;
//   2) to validate the query string on the server (see middleware/validateGameQuery.js).
// Using fixed lists means a user cannot send random text to the external API.

const CATEGORIES = [
  { value: 'mmorpg', label: 'MMORPG' },
  { value: 'shooter', label: 'Shooter' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'moba', label: 'MOBA' },
  { value: 'racing', label: 'Racing' },
  { value: 'sports', label: 'Sports' },
  { value: 'social', label: 'Social' },
  { value: 'sandbox', label: 'Sandbox' },
  { value: 'open-world', label: 'Open World' },
  { value: 'survival', label: 'Survival' },
  { value: 'pvp', label: 'PvP' },
  { value: 'card', label: 'Card Game' },
  { value: 'battle-royale', label: 'Battle Royale' },
  { value: 'mmo', label: 'MMO' },
  { value: 'anime', label: 'Anime' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'sci-fi', label: 'Sci-Fi' },
  { value: 'fighting', label: 'Fighting' },
  { value: 'action', label: 'Action' },
  { value: 'military', label: 'Military' },
  { value: 'zombie', label: 'Zombie' },
  { value: 'turn-based', label: 'Turn-Based' }
];

const PLATFORMS = [
  { value: 'all', label: 'All platforms' },
  { value: 'pc', label: 'PC (Windows)' },
  { value: 'browser', label: 'Web Browser' }
];

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Most popular' },
  { value: 'release-date', label: 'Newest first' },
  { value: 'alphabetical', label: 'A to Z' },
  { value: 'relevance', label: 'Relevance' }
];

module.exports = { CATEGORIES, PLATFORMS, SORT_OPTIONS };
