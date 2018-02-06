const db = require('./db');

function create(id, data) {
  const userData = Object.assign({
    createdAt: new Date(),

    learningMessagesPerMinute: 3,
    subscriptions: []
  }, data);

  return db.put('user', id, userData);
}

function getUser(id) {
  return db.get('user', id);
}

function addTasks(id, tasks) {
  return getUser(id)
    .then(user => {
      const newTasks = [...user.tasks, ...tasks];

      return db.createOrUpdate('user', id, { tasks: newTasks });
    });
}

function addTaskOnTop(id, data) {
  return getUser(id)
    .then(user => {
      const tasks = user.tasks;

      tasks.unshift({
        type: data.type,
        options: data.options
      });

      return db.createOrUpdate('user', id, { tasks });
    });
}

function shiftWaitForAnswerTask(id) {
  return getUser(id)
    .then(user => {
      const topTask = user.tasks[0];

      if (topTask.type === 'WAIT_ANSWER') {
        user.tasks.shift();

        return db
          .createOrUpdate('user', id, { tasks: user.tasks })
          .then(() => topTask);
      }
    });
}

function shiftTask(id) {
  return getUser(id)
    .then(user => {
      const topTask = user.tasks[0];

      if (!topTask) return;
      if (topTask.type === 'WAIT_ANSWER') return;
      if (topTask.type === 'LEARN') {
        if (user.lastLearningMessageAt) {
          const date = Date.now();
          const learningInterval = 60e3 / user.learningMessagesPerMinute;

          if (date - user.lastLearningMessageAt < learningInterval) {
            return;
          }
        }
      }

      user.tasks.shift();

      return db
        .createOrUpdate('user', id, { tasks: user.tasks })
        .then(() => topTask);
    });
}

function getAll() {
  return db.findAll('user');
}

function addSubscription(id, courseId) {
  return getUser(id)
    .then(user => {
      // todo: check if subscription exists

      user.subscriptions.push({
        course: courseId,
        subscribedAt: new Date()
      });

      return user.save();
    });
}

function stopSubscription(id, courseId) {
  return getUser(id)
    .then(user => {
      user.subscriptions = user.subscriptions.reduce((subscriptions, subscription) => {
        if (subscription.course === courseId) {
          subscription.stoppedAt = new Date()
        }
        return subscriptions;
      }, []);

      return user.save();
    });
}

function finishSubscription(id, courseId) {
  return getUser(id)
    .then(user => {
      user.subscriptions = user.subscriptions.reduce((subscriptions, subscription) => {
        if (subscription.course === courseId) {
          subscription.finishedAt = new Date()
        }
        return subscriptions;
      }, []);

      return user.save();
    });
}

function updateLastLearnMessageAt(id, sentAt) {
  return getUser(id)
    .then(user => {
      user.lastLearningMessageAt = sentAt;

      return user.save();
    });
}

module.exports = {
  create,
  getUser,
  addTasks,
  addTaskOnTop,
  shiftWaitForAnswerTask,
  getAll,
  shiftTask,
  addSubscription,
  stopSubscription,
  finishSubscription,
  updateLastLearnMessageAt
};
