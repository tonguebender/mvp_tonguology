const db = require('./db');

db.registerCourses();

function get(id) {
  return db.get('course', id);
}

function getAll() {
  return db.getAll('course');
}

function put(id, data) {
  return db.put('course', id, data);
}


module.exports = {
  get,
  getAll,
  put,
};
