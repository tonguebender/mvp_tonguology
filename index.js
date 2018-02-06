require('./lib/server');

// todo: refactor to observers or similar
const actions = require('./lib/actions');
actions.startLearningCircle();


// Process management stuff
const db = require('./lib/db');
// todo: needs improvement
process.on('SIGINT', function() {
  db.closeConnection(() => {
    console.log('Disconnected from mongodb');
    process.exit(0);
  });
});
// nodemon restart hacks todo: wrap in dev check
process.once('SIGUSR2', function() {
  db.closeConnection(() => {
    console.log('Disconnected from mongodb');
    process.kill(process.pid, 'SIGUSR2');
  });
});
