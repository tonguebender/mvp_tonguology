const db = require('./db');
const users = require('./users');

function send({ chatId, userId, type, text, image, audio, buttons }) {
  if (typeof userId === 'undefined') throw new Error('Send message error: userId is empty');
  if (typeof chatId === 'undefined') throw new Error('Send message error: chatId is empty');
  if (typeof text === 'undefined' && typeof image === 'undefined' && typeof audio === 'undefined')
    throw new Error('Send message error: message is empty');

  const messageData = { createdAt: new Date(), chatId, userId, type, text, image, audio, buttons };

  return db.push('message', messageData);
}

function getNew() {
  return db.findAllSorted('message', { sentAt: { $exists: false } });
}

function markAsSent(messages) {
  const sentAtDict = messages.reduce((dict, message) => {
    dict[message.id] = message.sentAt;

    return dict;
  }, {});

  return db.findByIds('message', messages.map(message => message.id))
    .then(docs => {
      return Promise.all(docs.map(doc => {
        doc.sentAt = sentAtDict[doc._id.toString()];

        return doc.save();
      }))
        .then(messages => {
          return Promise.all(messages.reduce((updateUsers, message) => {
            if (message.type === 'learn') {
              updateUsers.push(users.updateLastLearnMessageAt(message.userId, message.sentAt));
            }

            return updateUsers
          }, []))
        });
    })
    .catch(err => {
      console.log('markAsSent error:', err);
    });
}

module.exports = {
  send,
  getNew,
  markAsSent
};
