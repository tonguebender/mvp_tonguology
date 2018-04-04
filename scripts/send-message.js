const db = require('../lib/db');
const message = require('../lib/messages');

const [ node, script, chatId, userId, text ] = process.argv;

db.getConnection()
  .then(() => {
    message.send({ chatId, userId, type: 'text', text })
      .then(res => {
        console.log('message sent');
        db.closeConnection();
      });
  });
