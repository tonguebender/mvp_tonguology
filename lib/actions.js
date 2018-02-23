const users = require('./users');
const tongues = require('./tongues');
const courses = require('./courses');
const quizzes = require('./quizzes');
const messages = require('./messages');
const { TASKS, ACTIONS } = require('./consts');
const { convertTaskToAction } = require('./user-tasks');
const { flatten } = require('./utils');

const ACTIONS_QUEUE = [];

function pushIntoQueue(actions) {
  if (actions) {
    if (Array.isArray(actions)) {
      ACTIONS_QUEUE.push(...actions);
    } else {
      ACTIONS_QUEUE.push(actions);
    }
  }
}

function validateRequired(requiredParams, action) {
  for (const param of requiredParams) {
    if (typeof action[param] === 'undefined') {
      return Promise.reject(`${action.action} param error: '${param}' is empty`);
    }
  }

  return Promise.resolve(action);
}

async function processActions(actions) {
  if (!Array.isArray(actions)) throw new Error(`actions must be an array, instead got ${typeof actions}`);

  if (actions.length === 0) return Promise.resolve('ok');

  const action = actions.shift();

  if (action.action !== ACTIONS.TICK) {
    console.log('>', action.action, action);
  }

  return processAction(action)
    .then(res => {
      if (res) {
        if (Array.isArray(res)) {
          actions.push(...flatten(res));
        } else {
          actions.push(res);
        }
      }

      return processActions(actions);
    })
    .catch(e => {
      console.log(`Action "${action.action}" error`, e);

      return processActions(actions);
    });
}

function processAction(action) {
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
                    /*{
                      action: ACTIONS.SEND_MESSAGE,
                      userId: user.id,
                      text: `Here some courses for you: ${courses.toString()}. What would you like to learn?`,
                      buttons: courses
                    },
                    {
                      action: ACTIONS.ADD_TASKS_ON_TOP,
                      userId: user.id,
                      tasks: [
                        {
                          type: TASKS.WAIT_ANSWER,
                          options: {
                            questionType: 'subscribe'
                          },
                        }
                      ]
                    }*/
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
                            text: courseItem.text,
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

    case ACTIONS.USER_COMMAND_QUIZZES: {
      return validateRequired(['userId'], action)
        .then(action => {
          const { userId } = action;

          return quizzes.getAll()
            .then(quizzes => {
              return [
                {
                  action: ACTIONS.SEND_MESSAGE,
                  userId,
                  text: `Which quiz do you want to take?`,
                  buttons: quizzes
                },
                {
                  action: ACTIONS.ADD_TASKS_ON_TOP,
                  userId,
                  tasks: [
                    {
                      type: TASKS.WAIT_ANSWER,
                      options: {
                        questionType: 'take_quiz'
                      },
                    }
                  ]
                }
              ];
            }, err => {
              return [
                {
                  action: ACTIONS.SEND_MESSAGE,
                  userId,
                  text: `Something went wrong`
                }
              ]
            });
        });
    }

    case ACTIONS.USER_COMMAND_QUIZ: {
      return validateRequired(['userId', 'quizId'], action)
        .then(action => {
          const { userId, quizId } = action;

          return quizzes.get(quizId)
            .then(quiz => {
              const content = quiz.content.sort(() => 0.51 - Math.random()).slice(0, 10);

              return [
                {
                  action: ACTIONS.ADD_TASKS_ON_TOP,
                  userId,
                  tasks: content.map((quizItem, i, arr) => {
                    return {
                      type: TASKS.QUIZ_QUESTION,
                      options: {
                        quizId: quizId,
                        text: `${i + 1}/${arr.length}\n${quizItem.text}`,
                        answer: quizItem.answer,
                        note: quizItem.note,
                      }
                    };
                  }).concat([
                    {
                      type: TASKS.END_QUIZ,
                      options: {
                        quizId: quizId,
                      }
                    }
                  ])
                },
                {
                  action: ACTIONS.SEND_MESSAGE,
                  userId,
                  text: `You will be questioned: ${quizId}`
                }
              ];
            }, err => {
              return [
                {
                  action: ACTIONS.SEND_MESSAGE,
                  userId,
                  text: `Sorry, I can't find "${quizId}" quiz`
                }
              ]
            });
        });
    }

    case ACTIONS.USER_COMMAND_STOP: {
      return validateRequired(['userId'], action)
        .then(action => {
          const { userId } = action;

          return users.getTasks(userId)
            .then(tasks => {
              const topTask = tasks[0];

              if (topTask && topTask.options && topTask.options.quizId) {
                const quizId = topTask.options.quizId;

                return users.updateTasks(userId, tasks.filter(task => !task.options || task.options.quizId !== quizId))
                  .then(() => {
                    return [
                      {
                        action: ACTIONS.SEND_MESSAGE,
                        userId,
                        text: `Quiz has been stopped`
                      }
                    ];
                  });
              }

              return [
                {
                  action: ACTIONS.SEND_MESSAGE,
                  userId,
                  text: `Nothing to stop now`
                }
              ]
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

          return tongues.search(cleanText)
            .then(text => {
              return [
                {
                  action: ACTIONS.SEND_MESSAGE,
                  userId,
                  text: text || 'Nothing found'
                }
              ];
            });
        });
    }

    case ACTIONS.USER_COMMAND_DEFINE: {
      const { userId, text } = action;
      const cleanText = text.trim().toLowerCase();

      return tongues.search(cleanText)
        .then(text => {
          return [
            {
              action: ACTIONS.SEND_MESSAGE,
              userId,
              text: text || 'Nothing found'
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
              return text && messages
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

    case ACTIONS.ADD_TASKS_ON_TOP: {
      const { userId, tasks } = action;
      if (typeof userId === 'undefined') throw new Error('ACTIONS.ADD_TASKS_ON_TOP user is undefined');

      return users
        .addTasksOnTop(userId, tasks)
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
}

function startLearningCircle() {
  setInterval(() => {
    pushIntoQueue({
      action: ACTIONS.TICK,
    });
  }, 3000);
}

async function scheduleQueueProcess() {
  try {
    await processActions(ACTIONS_QUEUE);
    setTimeout(scheduleQueueProcess, 100);
  } catch (e) {
    console.log('Process actions error:', e);
  }
}

function start() {
  scheduleQueueProcess();
  startLearningCircle();
}

module.exports = {
  start,
  processActions,
  pushIntoQueue,
  ACTIONS
};
