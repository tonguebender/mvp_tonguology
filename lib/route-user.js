const db = require('./db');

module.exports = {
  create: function (id, data) {
    return new Promise((resolve, reject) => {
      db.put('user', id, data).then(resolve, reject);
    });
  }
};
