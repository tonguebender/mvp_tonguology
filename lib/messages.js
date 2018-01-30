const db = require('./db');

function send(data) {
  console.log('send message', data);
  return db.push('message', data);
}

module.exports = {
  send
};
