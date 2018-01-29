const users = require('./users');

module.exports = {

  create: function(id, data) {
    return users.create(id, data);
  },

  subscribe: function(userId, courseId) {
    return users.addTasks(userId, courseId);
  },

};
