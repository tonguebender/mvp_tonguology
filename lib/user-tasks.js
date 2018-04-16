const { ACTIONS, TASKS } = require('./consts');

function convertTaskToAction(task, userId, text) {
  console.log('convertTaskToAction', task);
  switch (task.type) {

    case TASKS.MESSAGE: {
      return [
        {
          action: ACTIONS.SEND_MESSAGE,
          userId: userId,
          text: `${task.options.text}`,
          buttons: task.options.buttons,
        },
        task.options.duration && {
          action: ACTIONS.ADD_TASKS_ON_TOP,
          userId: userId,
          tasks: [
            {
              type: TASKS.WAIT,
              options: {
                createdAt: Date.now(),
                groupId: task.options.groupId,
                duration: task.options.duration,
                contextData: task.options.contextData,
                contextButtons: task.options.buttons,
              },
            },
          ],
        },
      ];
    }

    case TASKS.END_COURSE: {
      return {
        action: ACTIONS.MARK_COURSE_AS_FINISHED,
        userId,
        courseId: task.options.courseId
      };
    }

    case TASKS.END_QUIZ: {
      return {
        action: ACTIONS.SEND_MESSAGE,
        userId,
        type: 'learn',
        text: `You have finished the quiz`,
      };
    }
  }
}

module.exports = {
  TASKS,
  convertTaskToAction
};
