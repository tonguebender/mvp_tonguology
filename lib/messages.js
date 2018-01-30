const db = require('./db');

function send(data) {
  const messageData = Object.assign({ createdAt: new Date() }, data);
  
  return db.push('message', messageData);
}

module.exports = {
  send
};
