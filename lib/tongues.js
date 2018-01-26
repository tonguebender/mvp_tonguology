const db = require('./db');

const tongues = [
  'en-gb-dict',
  'en-grammar',
];

db.registerTongue('en-gb-dict');
db.registerTongue('en-grammar');

function get(tongue, id) {
  if (!tongues.includes(tongue)) {
    throw new Error(`Unknown tongue: ${tongue}`);
  }

  return db.get(tongue, id);
}

function put(tongue, id, data) {
  return db.get(tongue, id, { data });
}


module.exports = {
  tongues,
  get,
  put,
};
