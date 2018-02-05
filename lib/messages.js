const db = require('./db');

function send(data) {
  const { chatId, text } = data;

  if (typeof chatId === 'undefined') throw new Error('Send message error: chatId is empty');
  if (typeof text === 'undefined') throw new Error('Send message error: text is empty');

  const messageData = Object.assign({ createdAt: new Date() }, { chatId, text });

  return db.push('message', messageData);
}

function getNew() {
  return db.findAll('message', { sentAt: { $exists: false } });
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
      }));
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
