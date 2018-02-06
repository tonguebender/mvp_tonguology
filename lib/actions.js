const users = require('./users');
const courses = require('./courses');
const messages = require('./messages');

const ACTIONS = {
  USER_COMMAND_START: 'USER_COMMAND_START',
  SEND_MESSAGE: 'SEND_MESSAGE',
  ADD_TASK_ON_TOP: 'ADD_TASK_ON_TOP',
  WAIT_ANSWER: 'WAIT_ANSWER',
  ADD_TASKS: 'ADD_TASKS',
  USER_MESSAGE: 'USER_MESSAGE',
  USER_COMMAND_SUBSCRIBE: 'USER_COMMAND_SUBSCRIBE',
  TICK: 'TICK',
  LEARN: 'LEARN',
};

function validateRequired(requiredParams, action) {
  for (const param of requiredParams) {
    if (typeof action[param] === 'undefined') {
      return Promise.reject(`${action.action} param error: '${param}' is empty`);
    }
  }

  return Promise.resolve(action);
}

function processActions(actions) {
  if (!Array.isArray(actions)) throw new Error(`actions must be an array, instead got ${typeof actions}`);

  if (actions.length === 0) return Promise.resolve('ok');

  return Promise.all(actions.map(action => {
    if (!action) return;

    console.log('>', action.action, action);

    switch (action.action) {

      case ACTIONS.USER_COMMAND_START: {
        return validateRequired(['userId', 'name', 'chatId', 'fullInfo'], action)
          .then(action => {
            const { userId, name, chatId, fullInfo } = action;

            return users.getUser(userId)
              .then(user => {
                return [
                  {
                    action: ACTIONS.SEND_MESSAGE,
                    userId,
                    text: `Hi ${user.name}!`
                  },
                ];
              })
              .catch(err => {
                // todo: handle DB error
                return users.create(userId, { name, chatId, fullInfo })
                  .then(user => {
                    return courses.getAll()
                      .then(courses => ({ user, courses }))
                      .catch(err => ({ user, courses: null }))
                  })
                  .then(({ user, courses }) => {
                    return [
                      {
                        action: ACTIONS.SEND_MESSAGE,
                        userId,
                        text: `Welcome ${user.name}!`
                      },
                      courses && {
                        action: ACTIONS.SEND_MESSAGE,
                        userId: user.id,
                        text: `Choose some courses for you: ${courses.toString()}`
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
                    ];
                  });
              });
          });
      }

      case ACTIONS.USER_COMMAND_SUBSCRIBE: {
        return validateRequired(['userId', 'course'], action)
          .then(action => {
            const { userId, course } = action;

            return courses.getTasks(course)
              .then(tasks => {
                return users.addSubscription(userId, course)
                  .then(() => tasks);
              })
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
          });
      }

      case ACTIONS.SEND_MESSAGE: {
        // todo: make sure that order of messages is correct
        return validateRequired(['userId', 'text'], action)
          .then(action => {
            const { userId, text, type } = action;

            return users.getUser(userId)
              .then(user => {
                return messages
                  .send({
                    chatId: user.chatId,
                    userId,
                    type,
                    text
                  })
                  .then(() => []);
              })
              .catch(err => console.log(`${ACTIONS.SEND_MESSAGE} error:`, err));
          });
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
            action: ACTIONS.USER_COMMAND_SUBSCRIBE,
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
        type: 'learn',
        text: `Learn ${task.options.entity}`
      }
    }
  }
}

function startLearningCircle() {
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
  startLearningCircle,
  processActions,
  ACTIONS
};
