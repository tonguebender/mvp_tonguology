const { ACTIONS, TASKS } = require('./consts');

function convertTaskToAction(task, userId, text) {
  switch (task.type) {
    case TASKS.WAIT_ANSWER: {
      const command = task.options.command;

      switch (command) {
        case 'subscribe':
          return {
            action: ACTIONS.USER_COMMAND_SUBSCRIBE,
            userId: userId,
            courseId: text
          };
        default:
          throw new Error(`Unknown command ${command}`);
      }
    }
    case TASKS.LEARN: {
      return {
        action: ACTIONS.SEND_MESSAGE,
        userId: userId,
        type: 'learn',
        text: `Learn ${task.options.entity}`
      }
    }
    case TASKS.END_COURSE: {
      return {
        action: ACTIONS.MARK_COURSE_AS_FINISHED,
        userId,
        courseId: task.options.courseId
      };
    }
  }
}

module.exports = {
  TASKS,
  convertTaskToAction
};
