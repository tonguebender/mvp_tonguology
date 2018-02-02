const db = require('./db');

function create(id, data) {
  return db.put('user', id, data);
}

function get(id) {
  return db.get('user', id);
}

function addTasks(id, tasks) {
  return get(id)
    .then(user => {
      const newTasks = [...user.tasks, ...tasks];

      return db.createOrUpdate('user', id, { tasks: newTasks });
    });
}

function addTaskOnTop(id, data) {
  return get(id)
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
  return get(id)
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
  return get(id)
    .then(user => {
      const topTask = user.tasks[0];

      if (topTask && topTask.type !== 'WAIT_ANSWER') {
        user.tasks.shift();

        return db
          .createOrUpdate('user', id, { tasks: user.tasks })
          .then(() => topTask);
      }
    });
}

function getAll() {
  return db.findAll('user');
}

module.exports = {
  create,
  get,
  addTasks,
  addTaskOnTop,
  shiftWaitForAnswerTask,
  getAll,
  shiftTask,
};
