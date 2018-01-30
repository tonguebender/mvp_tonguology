const messages = require('./messages');

function process(user, task) {
  const { type } = task;

  switch(type) {
    case 'learn':
      return processLearnTask(user, task);
  }
}

function processLearnTask(user, task) {
  return messages.send({
    user: user.id,
    text: `Learn: ${task.options.entity}`
  });
}

module.exports = {
  process
};
