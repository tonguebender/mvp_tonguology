const db = require('./db');
const users = require('./users');

const tests = [
  () => {
    return 'skip';
    return users.create('user1', { description: "123" })
      .then(res => {
        console.log('users.create() result:', res);
      }, err => {
        console.error('users.create() error:', err);
        return Promise.reject(err);
      });
  },
  () => {
    return users.addTasks('user1', 'course1');
  },
  () => {
    return users.processTasks()
      .then(res => {
        console.log('users.processTasks() result:', res);
      }, err => {
        console.error('users.processTasks() error:', err);
      });
  }
];

Promise
  .all(tests.reduce((tests, test) => {
    if (typeof test === "function") tests.push(test());

    return tests;
  }, []))
  .then(ok => {
    console.log('all ok');
    db.closeConnection();
  }, err => {
    console.error('not ok', err);
    db.closeConnection();
    process.exit(1);
  });
