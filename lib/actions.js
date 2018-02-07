const users = require('./users');
const courses = require('./courses');
const messages = require('./messages');
const { TASKS, ACTIONS } = require('./consts');
const { convertTaskToAction } = require('./user-tasks');

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

    if (action.action !== ACTIONS.TICK) {
      console.log('>', action.action, action);
    }

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
                    // todo: handle empty courses
                    return [
                      {
                        action: ACTIONS.SEND_MESSAGE,
                        userId,
                        text: `Welcome ${user.name}!`
                      },
                      {
                        action: ACTIONS.SEND_MESSAGE,
                        userId: user.id,
                        text: `Here some courses for you: ${courses.toString()}. What would you like to learn?`,
                        buttons: courses
                      },
                      {
                        action: ACTIONS.ADD_TASK_ON_TOP,
                        userId: user.id,
                        taskData: {
                          type: TASKS.WAIT_ANSWER,
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
        return validateRequired(['userId', 'courseId'], action)
          .then(action => {
            const { userId, courseId } = action;

            return courses.get(courseId)
              .then(course => {
                return users.addSubscription(userId, courseId)
                  .then(() => {
                    return [
                      {
                        action: ACTIONS.ADD_TASKS,
                        userId,
                        tasks: course.content.map(courseItem => {
                          return {
                            type: TASKS.LEARN,
                            options: {
                              tongue: courseItem.tongue,
                              entity: courseItem.id,
                              course: courseId
                            }
                          };
                        }).concat([
                          {
                            type: TASKS.END_COURSE,
                            options: {
                              courseId
                            }
                          }
                        ])
                      },
                      {
                        action: ACTIONS.SEND_MESSAGE,
                        userId,
                        text: `You are now subscribed to: ${courseId}`
                      }
                    ];
                  });
              }, err => {
                return [
                  {
                    action: ACTIONS.SEND_MESSAGE,
                    userId,
                    text: `Sorry, I can't find ${courseId} course`
                  }
                ]
              });
          });
      }

      case ACTIONS.USER_COMMAND_UNSUBSCRIBE: {
        return validateRequired(['userId', 'courseId'], action)
          .then(action => {
            const { userId, courseId } = action;

            return users.stopSubscription(userId, courseId)
              .then(() => {
                return [
                  {
                    action: ACTIONS.SEND_MESSAGE,
                    userId,
                    text: `You've been successfully unsubscribed from ${courseId}`
                  }
                ];
              });
          });
      }

      case ACTIONS.NEXT_LEARNING_TASK: {
        return validateRequired(['userId'], action)
          .then(action => {
            const { userId } = action;

            return users.shiftTopTask(userId)
              .then(task => {
                if (task) return convertTaskToAction(task, userId);


                return [
                  {
                    action: ACTIONS.SEND_MESSAGE,
                    userId,
                    text: `Nothing here yet`
                  }
                ];
              });
          });
      }

      case ACTIONS.USER_MESSAGE: {
        const { userId, text } = action;
        const cleanText = text.trim().toLowerCase();

        return users.shiftWaitForAnswerTask(userId)
          .then(task => {
            if (task) return convertTaskToAction(task, userId, text);

            if (cleanText === 'next') {
              return [
                {
                  action: ACTIONS.NEXT_LEARNING_TASK,
                  userId
                }
              ];
            }

            return [
              {
                action: ACTIONS.SEND_MESSAGE,
                userId,
                text: `I do not know how to help with this` // todo: randomize answers
              }
            ];
          });
      }

      case ACTIONS.MARK_COURSE_AS_FINISHED: {
        return validateRequired(['userId', 'courseId'], action)
          .then(action => {
            const { userId, courseId } = action;

            return users.finishSubscription(userId, courseId)
              .then(() => {
                return [
                  {
                    action: ACTIONS.SEND_MESSAGE,
                    userId,
                    text: `You've successfully finished ${courseId}`
                  }
                ];
              });
          });
      }

      case ACTIONS.SEND_MESSAGE: {
        // todo: make sure that order of messages is correct
        return validateRequired(['userId', 'text'], action)
          .then(action => {
            const { userId, text, type, buttons } = action;

            return users.getUser(userId)
              .then(user => {
                return messages
                  .send({
                    chatId: user.chatId,
                    userId,
                    type,
                    text,
                    buttons,
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
