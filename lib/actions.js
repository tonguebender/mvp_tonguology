const users = require('./users');
const courses = require('./courses');
const messages = require('./messages');

const ACTIONS = {
  CREATE_USER: 'CREATE_USER',
  SEND_MESSAGE: 'SEND_MESSAGE',
  ADD_TASK_ON_TOP: 'ADD_TASK_ON_TOP',
  WAIT_ANSWER: 'WAIT_ANSWER',
  ADD_TASKS: 'ADD_TASKS',
  USER_MESSAGE: 'USER_MESSAGE',
  SUBSCRIBE: 'SUBSCRIBE',
  TICK: 'TICK',
  LEARN: 'LEARN',
};

function processActions(actions) {
  if (!Array.isArray(actions)) throw new Error(`actions must be an array, instead got ${typeof actions}`);

  if (actions.length === 0) return Promise.resolve('ok');

  return Promise.all(actions.map(action => {
    if (!action) return;

    console.log('>', action.action, action);

    switch (action.action) {

      case ACTIONS.CREATE_USER: {
        const { userId, data } = action;

        return users.create(userId, data)
          .then(user => {
            return courses.getAll()
              .then(courses => {
                return { user, courses }
              });
          })
          .then(({ user, courses }) => {
            return [
              {
                action: ACTIONS.SEND_MESSAGE,
                userId: user.id,
                text: `Hi ${user.name}!`
              },
              {
                action: ACTIONS.SEND_MESSAGE,
                userId: user.id,
                text: `Here some courses for you: ${courses.toString()}`
              },
              {
                action: ACTIONS.ADD_TASK_ON_TOP,
                userId: user.id,
                taskData: {
                  type: ACTIONS.WAIT_ANSWER,
                  options: {
                    command: 'subscribe'
                  },
                }
              }
            ]
          });
      }

      case ACTIONS.SEND_MESSAGE: {
        const { userId, text } = action;
        if (typeof userId === 'undefined') throw new Error('ACTIONS.SEND_MESSAGE user is undefined');

        return users.get(userId)
          .then(user => {
            return messages
              .send({
                chatId: user.chatId,
                text
              })
              .then(() => []);
          })
          .catch(err => console.log('ACTIONS.SEND_MESSAGE error:', err));
      }

      case ACTIONS.ADD_TASK_ON_TOP: {
        const { userId, taskData } = action;
        if (typeof userId === 'undefined') throw new Error('ACTIONS.ADD_TASK_ON_TOP user is undefined');

        return users
          .addTaskOnTop(userId, taskData)
          .then(() => []);
      }

      case ACTIONS.ADD_TASKS: {
        const { userId, tasks } = action;
        if (typeof userId === 'undefined') throw new Error('ACTIONS.ADD_TASKS user is undefined');

        return users
          .addTasks(userId, tasks)
          .then(() => []);
      }

      case ACTIONS.USER_MESSAGE: {
        const { userId, text } = action;

        return users.shiftWaitForAnswerTask(userId)
          .then(task => {
            if (task) return convertTaskToAction(task, userId, text);

            return [
              {
                action: ACTIONS.SEND_MESSAGE,
                userId,
                text: `I do not know how to help with this` // todo: randomize answers
              }
            ];
          });
      }

      case ACTIONS.SUBSCRIBE: {
        const { userId, course } = action;
        if (typeof userId === 'undefined') throw new Error('ACTIONS.SUBSCRIBE user is undefined');

        return courses.getTasks(course)
          .then(tasks => {
            return [
              {
                action: ACTIONS.ADD_TASKS,
                userId,
                tasks: tasks.map(task => {
                  return {
                    type: task.type,
                    options: {
                      tongue: task.tongue,
                      entity: task.entity,
                      course: task.course,
                    }
                  };
                })
              },
              {
                action: ACTIONS.SEND_MESSAGE,
                userId,
                text: `You are know subscribed to: ${course}`
              }
            ]
          });
      }

      case ACTIONS.TICK: {
        return users.getAll()
          .then(allUsers => {
            return allUsers && Promise.all(allUsers.map(user => {
              return users.shiftTask(user.id)
                .then(task => {
                  if (task) {
                    return convertTaskToAction(task, user.id);
                  }
                });
            }));
          });
      }

      default: {
        return Promise.reject('bad action');
      }
    }
  }))
    .then(res => {
      const actions = res.reduce((actions, action) => {
        if (Array.isArray(action)) return [...actions, ...action];
        if (action) return [...actions, action];

        return actions;
      }, []);

      if (actions.length === 0) {
        return Promise.resolve('ok');
      }

      return processActions(actions);
    }, err => {
      console.log('processActions error:', err);
    });
}

function convertTaskToAction(task, userId, text) {
  switch (task.type) {
    case ACTIONS.WAIT_ANSWER: {
      const command = task.options.command;

      switch (command) {
        case 'subscribe':
          return {
            action: ACTIONS.SUBSCRIBE,
            userId: userId,
            course: text
          };
        default:
          throw new Error(`Unknown command ${command}`);
      }
    }
    case ACTIONS.LEARN: {
      return {
        action: ACTIONS.SEND_MESSAGE,
        userId: userId,
        text: `Learn ${task.options.entity}`
      }
    }
  }
}

function start() {
  setInterval(() => {
    // console.time('tick');

    processActions([{
      action: ACTIONS.TICK,
    }])
    .then(res => {
      // console.timeEnd('tick');
    }, err => {console.log('start error:', err);});
  }, 1000);
}

module.exports = {
  start,
  processActions,
  ACTIONS
};
