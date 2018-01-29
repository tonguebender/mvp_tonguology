const db = require('./db');
const courses = require('./courses');

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

module.exports = {
  create,
  get,
  addTasks
};
