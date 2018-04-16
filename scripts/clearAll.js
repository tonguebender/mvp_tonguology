const db = require('../lib/db');

db
  .getConnection()
  .then(() => {
    return db.getAll('user').then(users => {
      return Promise.all(users.map(user => db.delete('user', user)));
    });
  })
  .then(() => {
    return db.getAll('message').then(messages => {
      return Promise.all(messages.map(message => db.models['message'].deleteOne({ _id: message })));
    });
  })
  .then(() => {
    console.log('ok');
    db.closeConnection();
  });
