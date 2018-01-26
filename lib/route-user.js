const db = require('./db');

module.exports = {
  create: function (id, data) {
    console.log(id, data);
    return new Promise((resolve, reject) => {
      db.put('user', id, data).then(resolve, reject);
    });
  }
};
