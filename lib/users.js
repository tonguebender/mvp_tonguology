const db = require('./db');
const { TASKS } = require('./consts');

const MS = 1000;
const MINUTE = 60 * MS;
const HOUR = 60 * MINUTE;

function create(id, data) {
  const userData = Object.assign(
    {
      createdAt: new Date(),

      learningMessagesPerMinute: 5,
      subscriptions: [],
    },
    data,
  );

  return db.put('user', id, userData);
}

function getUser(id) {
  return db.get('user', id);
}

function getTasks(id) {
  return getUser(id).then(user => user.tasks);
}

function updateTasks(id, newTasks) {
  return getUser(id).then(() => {
    return db.createOrUpdate('user', id, { tasks: newTasks });
  });
}

function addTasks(id, tasks) {
  return getUser(id).then(user => {
    const newTasks = [...user.tasks, ...tasks];

    return db.createOrUpdate('user', id, { tasks: newTasks });
  });
}

function addTasksOnTop(id, topLevelTasks) {
  return getUser(id).then(user => {
    const tasks = user.tasks;
    const newTasks = [...topLevelTasks, ...tasks];

    return db.createOrUpdate('user', id, { tasks: newTasks });
  });
}

function shiftWaitForAnswerTask(id) {
  return getUser(id).then(user => {
    const topTask = user.tasks[0];

    if (topTask && topTask.type === TASKS.WAIT) {
      user.tasks.shift();

      return db.createOrUpdate('user', id, { tasks: user.tasks }).then(() => topTask);
    }
  });
}

function getTopWaitTask(id) {
  return getUser(id).then(user => {
    const topTask = user.tasks[0];

    if (topTask && topTask.type === TASKS.WAIT) {
      return topTask;
    }
  });
}

function shiftTask(id) {
  return getUser(id).then(user => {
    const topTask = user.tasks[0];

    if (!topTask) return;
    if (topTask.type === TASKS.WAIT) {
      const date = Date.now();
      if (date - topTask.options.createdAt < topTask.options.duration * MS) return;

      user.tasks.shift();

      return user.save().then(() => topTask);
    }

    // if (topTask.type === TASKS.LEARN && false) {
    //   if (user.lastLearningMessageAt) {
    //     const date = Date.now();
    //     const learningInterval = MINUTE / user.learningMessagesPerMinute;
    //
    //     if (date - user.lastLearningMessageAt < learningInterval) {
    //       return;
    //     }
    //
    //     if (user.learningMinuteSessionCounter >= user.learningMessagesPerMinute * 10 &&
    //       date - user.lastLearningMessageAt < HOUR) {
    //       return;
    //     } else {
    //       user.learningMinuteSessionCounter = 0;
    //     }
    //   }
    // }

    user.tasks.shift();

    return user.save().then(() => topTask);
  });
}

function shiftTopTask(id) {
  return getUser(id).then(user => {
    const topTask = user.tasks.shift();

    return user.save().then(() => topTask);
  });
}

function getAll() {
  return db.findAll('user');
}

function addSubscription(id, courseId) {
  return getUser(id).then(user => {
    // todo: check if subscription exists

    user.subscriptions.push({
      course: courseId,
      subscribedAt: new Date(),
    });

    return user.save();
  });
}

function stopSubscription(id, courseId) {
  return getUser(id).then(user => {
    user.subscriptions = user.subscriptions.reduce((subscriptions, subscription) => {
      if (subscription.course === courseId) {
        subscription.stoppedAt = new Date();
      }

      subscriptions.push(subscription);

      return subscriptions;
    }, []);

    user.tasks = user.tasks.filter(task => task.options.groupId !== courseId);

    return user.save();
  });
}

function finishSubscription(id, courseId) {
  return getUser(id).then(user => {
    user.subscriptions = user.subscriptions.reduce((subscriptions, subscription) => {
      if (subscription.course === courseId) {
        subscription.finishedAt = new Date();
      }

      subscriptions.push(subscription);

      return subscriptions;
    }, []);

    return user.save();
  });
}

function updateLastLearnMessageAt(id, sentAt) {
  return getUser(id).then(user => {
    user.lastLearningMessageAt = sentAt;
    user.learningMinuteSessionCounter = (user.learningMinuteSessionCounter || 0) + 1;

    return user.save();
  });
}

function getSubscriptions(id) {
  return getUser(id).then(user => {
    return user.subscriptions.filter(sbs => !sbs.stoppedAt && !sbs.finishedAt).map(sbs => sbs.course);
  });
}

module.exports = {
  create,
  getUser,
  getTasks,
  updateTasks,
  addTasks,
  addTasksOnTop,
  shiftWaitForAnswerTask,
  getTopWaitTask,
  getAll,
  shiftTask,
  shiftTopTask,
  getSubscriptions,
  addSubscription,
  stopSubscription,
  finishSubscription,
  updateLastLearnMessageAt,
};
