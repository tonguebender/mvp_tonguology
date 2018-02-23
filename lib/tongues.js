const httpTransport = require('./http-transport');

const TONGUARIUM_URL = process.env.TONGUARIUM_URL;
const SEARCH_URL = `${TONGUARIUM_URL}/search`;

function getSearchUrl(id) {
  return `${SEARCH_URL}/${id}`;
}

function search(id) {
  return httpTransport.get(getSearchUrl(id));
}

module.exports = {
  search
};
