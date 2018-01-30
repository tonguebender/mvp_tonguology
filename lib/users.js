const db = require('./db');
const courses = require('./courses');
const tasks = require('./tasks');

function create(id, data) {
  return db.put('user', id, data);
}

function get(id) {
  return db.get('user', id);
}

function addTasks(id, courseId) {
  return courses.getTasks(courseId)
    .then(tasks => {
      const formattedTasks = tasks.map(task => {
        return {
          type: task.type,
          options: {
            tongue: task.tongue,
            entity: task.entity,
            course: task.course,
          }
        }
      });
      return db.createOrUpdate('user', id, { tasks: formattedTasks });
    }, err => {
      return Promise.reject(err);
    });
}

function processTasks() {
  return db.findAll('user')
    .then(users => {
      return Promise.all(users.map(user => {
        if (!user.tasks.length) return;

        const task = user.tasks.shift();

        return tasks.process(user, task)
          .then(ok => {
            return new Promise((resolve, reject) => {
              user.save((err, doc) => {
                if (err) reject(err);

                resolve(doc);
              });
            });
          });
      }));
    });
}

module.exports = {
  create,
  get,
  addTasks,
  processTasks
};
