const users = require('./users');
const tongues = require('./tongues');
const courses = require('./courses');
const quizzes = require('./quizzes');
const messages = require('./messages');
const { TASKS, ACTIONS, CONTEXTS } = require('./consts');
const { convertTaskToAction } = require('./user-tasks');
const { messageToAction } = require('./message-processor');
const { flatten, smartCut, cleanMessage, getRandomSubArray } = require('./utils');

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
    const date = new Date();
    console.log(`${date.toLocaleTimeString()}.${date % 1000} >`, action.action, JSON.stringify(action, null, ' '));
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
      return validateRequired(['userId', 'name', 'chatId', 'fullInfo'], action).then(action => {
        const { userId, name, chatId, fullInfo } = action;

        return users
          .getUser(userId)
          .then(user => {
            return [
              {
                action: ACTIONS.SEND_MESSAGE,
                userId,
                text: `Hi ${user.name}!`,
              },
            ];
          })
          .catch(err => {
            // todo: handle DB error
            return users.create(userId, { name, chatId, fullInfo }).then(user => {
              return [
                {
                  action: ACTIONS.SEND_MESSAGE,
                  userId,
                  text: `Welcome ${user.name}!`,
                },
              ];
            });
          });
      });
    }

    case ACTIONS.USER_COMMAND_SUBSCRIBE: {
      return validateRequired(['userId', 'courseId'], action).then(action => {
        const { userId, courseId } = action;

        return courses.get(courseId).then(
          course => {
            return users.addSubscription(userId, courseId).then(() => {
              return [
                {
                  action: ACTIONS.ADD_TASKS,
                  userId,
                  tasks: course.content
                    .map(courseItem => {
                      return {
                        type: TASKS.MESSAGE,
                        options: {
                          groupId: courseId,
                          text: courseItem.text,
                          // todo: do not add next for the last one
                          buttons: (courseItem.data.buttons || []).concat('Next'),
                          duration: courseItem.data.duration || 60,
                          contextData: courseItem.data.contextData,
                        },
                      };
                    })
                    .concat({
                      type: TASKS.END_COURSE,
                      options: {
                        groupId: courseId,
                        courseId,
                      },
                    }),
                },
              ];
            });
          },
          err => {
            return [
              {
                action: ACTIONS.SEND_MESSAGE,
                userId,
                text: `Sorry, I can't find ${courseId} course`,
              },
            ];
          },
        );
      });
    }

    case ACTIONS.USER_COMMAND_UNSUBSCRIBE: {
      return validateRequired(['userId', 'courseId'], action).then(action => {
        const { userId, courseId } = action;

        return users.stopSubscription(userId, courseId).then(() => {
          return [
            {
              action: ACTIONS.SEND_MESSAGE,
              userId,
              text: `You've been successfully unsubscribed from ${courseId}`,
            },
          ];
        });
      });
    }

    case ACTIONS.USER_COMMAND_QUIZ: {
      return validateRequired(['userId', 'quizId'], action).then(action => {
        const { userId, quizId } = action;

        return quizzes.get(quizId).then(
          quiz => {
            // return users.addSubscription(userId, quizId)
            //   .then(() => {
            const content = getRandomSubArray(quiz.content, 3);

            return [
              {
                action: ACTIONS.ADD_TASKS_ON_TOP,
                userId,
                tasks: content
                  .map(quizItem => {
                    return {
                      type: TASKS.MESSAGE,
                      options: {
                        groupId: quizId,
                        text: quizItem.text,
                        buttons: quizItem.data.buttons || [],
                        duration: quizItem.data.duration || 60,
                        contextData: quizItem.data.contextData,
                      },
                    };
                  })
                  .concat({
                    type: TASKS.MESSAGE,
                    options: {
                      groupId: quizId,
                      text: 'done',
                    },
                  }),
              },
            ];
            // });
          },
          () => {
            return [
              {
                action: ACTIONS.SEND_MESSAGE,
                userId,
                text: `Sorry, I can't find ${quizId} quiz`,
              },
            ];
          },
        );
      });
    }

    case ACTIONS.USER_COMMAND_STOP: {
      return validateRequired(['userId'], action).then(action => {
        const { userId, text } = action;

        if (text) {
          return users.getSubscriptions(userId).then(subscriptions => {
            const num = parseInt(text) - 1;

            return {
              action: ACTIONS.USER_COMMAND_UNSUBSCRIBE,
              userId,
              courseId: subscriptions[num],
            };
          });
        } else {
          return {
            action: ACTIONS.SEND_MESSAGE,
            userId,
            text: `Nothing here yet`,
          };
        }
      });
    }

    case ACTIONS.SKIP_WAITING: {
      const { userId } = action;
      return users.shiftWaitForAnswerTask(userId).then(() => {});
    }

    case ACTIONS.USER_MESSAGE: {
      const { userId, text, name, chatId, fullInfo } = action;
      // TODO: store user messages

      return users
        .getUser(userId)
        .then(user => {
          return user;
        })
        .catch(() => {
          return users.create(userId, { name, chatId, fullInfo }).then(user => {
            return user;
          });
        })
        .then(() => {
          return users.getTopWaitTask(userId).then(waitTask => {
            return messageToAction(text, userId, waitTask && waitTask.options);
          });
        });
    }

    case ACTIONS.RESPOND_WITH_NOT_FOUND: {
      return validateRequired(['userId'], action).then(action => {
        const { userId } = action;

        return {
          action: ACTIONS.SEND_MESSAGE,
          userId,
          text: 'Nothing found',
        };
      });
    }

    case ACTIONS.RESPOND_WITH_DEFINITION: {
      return validateRequired(['userId', 'text'], action).then(action => {
        const { userId, text } = action;

        return tongues.getDefinition(text).then(
          definition => {
            if (definition) {
              const { left, right } = smartCut(definition, 250, ';');

              return [
                {
                  action: ACTIONS.SEND_MESSAGE,
                  userId,
                  text: left,
                  buttons: right ? ['more'] : [],
                },
                right && {
                  action: ACTIONS.ADD_TASKS_ON_TOP,
                  userId,
                  tasks: [
                    {
                      type: TASKS.WAIT,
                      options: {
                        createdAt: Date.now(),
                        duration: 10,
                        contextData: {
                          type: CONTEXTS.DEFINITION,
                          entity: text,
                          more: right,
                        },
                      },
                    },
                  ],
                },
              ];
            } else {
              return {
                action: ACTIONS.RESPOND_WITH_NOT_FOUND,
                userId,
              };
            }
          },
          () => {
            return [
              {
                action: ACTIONS.RESPOND_WITH_NOT_FOUND,
                userId,
              },
            ];
          },
        );
      });
    }

    case ACTIONS.RESPOND_WITH_IMAGE: {
      return validateRequired(['userId', 'text'], action).then(action => {
        const { userId, text } = action;

        return tongues.getImage(text).then(data => {
          return [
            data
              ? {
                  action: ACTIONS.SEND_MESSAGE,
                  userId,
                  image: data.image,
                }
              : {
                  action: ACTIONS.RESPOND_WITH_NOT_FOUND,
                  userId,
                },
          ];
        });
      });
    }

    case ACTIONS.RESPOND_WITH_AUDIO: {
      return validateRequired(['userId', 'text'], action).then(action => {
        const { userId, text } = action;

        return tongues.getAudio(text).then(data => {
          return [
            data
              ? {
                  action: ACTIONS.SEND_MESSAGE,
                  userId,
                  audio: data.audio,
                }
              : {
                  action: ACTIONS.RESPOND_WITH_NOT_FOUND,
                  userId,
                },
          ];
        });
      });
    }

    case ACTIONS.RESPOND_WITH_EXAMPLES: {
      return validateRequired(['userId', 'text'], action).then(action => {
        const { userId, text } = action;

        return tongues.getExamples(text).then(examples => {
          return [
            examples
              ? {
                  action: ACTIONS.SEND_MESSAGE,
                  userId,
                  text: examples,
                }
              : {
                  action: ACTIONS.RESPOND_WITH_NOT_FOUND,
                  userId,
                },
          ];
        });
      });
    }

    case ACTIONS.RESPOND_WITH_SYNONYMS: {
      return validateRequired(['userId', 'text'], action).then(action => {
        const { userId, text } = action;

        return tongues.getSynonyms(text).then(synonyms => {
          return [
            synonyms
              ? {
                  action: ACTIONS.SEND_MESSAGE,
                  userId,
                  text: synonyms,
                }
              : {
                  action: ACTIONS.RESPOND_WITH_NOT_FOUND,
                  userId,
                },
          ];
        });
      });
    }

    case ACTIONS.RESPOND_WITH_IPA: {
      return validateRequired(['userId', 'text'], action).then(action => {
        const { userId, text, raw = false } = action;

        return tongues.getIPA(text).then(ipa => {
          return [
            ipa
              ? {
                  action: ACTIONS.SEND_MESSAGE,
                  userId,
                  text: raw ? `/${ipa}/` : `*${text}* /${ipa}/`,
                }
              : {
                  action: ACTIONS.RESPOND_WITH_NOT_FOUND,
                  userId,
                },
          ];
        });
      });
    }

    case ACTIONS.RESPOND_WITH_TRANSLATION: {
      return validateRequired(['userId', 'text'], action).then(action => {
        const { userId, text } = action;

        return tongues.getTranslation(text).then(translation => {
          return [
            translation
              ? {
                  action: ACTIONS.SEND_MESSAGE,
                  userId,
                  text: translation,
                }
              : {
                  action: ACTIONS.RESPOND_WITH_NOT_FOUND,
                  userId,
                },
          ];
        });
      });
    }

    case ACTIONS.RESPOND_WITH_QUIZ_ANSWER: {
      return validateRequired(['userId', 'contextData'], action).then(action => {
        const { userId, text = '', contextData } = action;
        const { answer } = contextData;

        if (action.timedOut) {
          return [
            {
              action: ACTIONS.SEND_MESSAGE,
              userId,
              text: '⌛️',
            },
            {
              action: ACTIONS.SEND_MESSAGE,
              userId,
              text: `**${answer}**`,
            },
          ];
        }

        const cleanText = text.trim().toLowerCase();

        if (cleanText === answer) {
          return [
            {
              action: ACTIONS.SEND_MESSAGE,
              userId,
              text: '👍',
            },
            {
              action: ACTIONS.SKIP_WAITING,
              userId,
            },
          ];
        } else {
          return [
            {
              action: ACTIONS.SEND_MESSAGE,
              userId,
              text: '👎',
            },
            {
              action: ACTIONS.SEND_MESSAGE,
              userId,
              text: `**${answer}**`,
            },
            {
              action: ACTIONS.SKIP_WAITING,
              userId,
            },
          ];
        }
      });
    }

    case ACTIONS.RESPOND_WITH_COURSES: {
      const { userId } = action;

      return courses.getAll().then(courses => {
        return [
          {
            action: ACTIONS.SEND_MESSAGE,
            userId,
            text: `Available courses:\n${courses
              .map((course, i) => `${i + 1}. ${course}`)
              .join(' ')}.\nChoose a number.`,
          },
          {
            action: ACTIONS.ADD_TASKS_ON_TOP,
            userId,
            tasks: [
              {
                type: TASKS.WAIT,
                options: {
                  createdAt: Date.now(),
                  duration: 60,
                  contextData: {
                    type: CONTEXTS.SUBSCRIBE,
                    courses: courses,
                  },
                },
              },
            ],
          },
        ];
      });
    }

    case ACTIONS.RESPOND_WITH_QUIZZES: {
      return validateRequired(['userId'], action).then(action => {
        const { userId } = action;

        return quizzes.getAll().then(
          quizzes => {
            return [
              {
                action: ACTIONS.SEND_MESSAGE,
                userId,
                text: `Which quiz do you want to take?\n${quizzes.map((q, i) => `${i + 1}. ${q}`)}`,
                buttons: quizzes.map((q, i) => i + 1),
              },
              {
                action: ACTIONS.ADD_TASKS_ON_TOP,
                userId,
                tasks: [
                  {
                    type: TASKS.WAIT,
                    options: {
                      createdAt: Date.now(),
                      duration: 60,
                      contextData: {
                        type: CONTEXTS.TAKE_QUIZ,
                        quizzes,
                      },
                    },
                  },
                ],
              },
            ];
          },
          () => {
            return [
              {
                action: ACTIONS.RESPOND_WITH_NOT_FOUND,
                userId,
              },
            ];
          },
        );
      });
    }

    case ACTIONS.RESPOND_WITH_SUBSCRIPTIONS: {
      const { userId } = action;

      return users.getSubscriptions(userId).then(subscriptions => {
        if (subscriptions && subscriptions.length) {
          return [
            {
              action: ACTIONS.SEND_MESSAGE,
              userId,
              text: `Your courses:\n${subscriptions.map(
                (course, i) => `${i + 1}. ${course}`,
              )}.\nTo stop a subscription type: stop 1.`,
            },
          ];
        } else {
          return [
            {
              action: ACTIONS.SEND_MESSAGE,
              userId,
              text: `You have no subscriptions.\nTo get list of available courses type: courses`,
              buttons: ['courses'],
            },
          ];
        }
      });
    }

    case ACTIONS.RESPOND_WITH_HI: {
      return validateRequired(['userId'], action).then(action => {
        const { userId } = action;

        return {
          action: ACTIONS.SEND_MESSAGE,
          userId,
          text: 'Hi!',
        };
      });
    }

    case ACTIONS.RESPOND_WITH_PONG: {
      return validateRequired(['userId'], action).then(action => {
        const { userId } = action;

        return {
          action: ACTIONS.SEND_MESSAGE,
          userId,
          text: 'pong',
        };
      });
    }

    case ACTIONS.MARK_COURSE_AS_FINISHED: {
      return validateRequired(['userId', 'courseId'], action).then(action => {
        const { userId, courseId } = action;

        return users.finishSubscription(userId, courseId).then(() => {
          return [
            {
              action: ACTIONS.SEND_MESSAGE,
              userId,
              text: `You've successfully finished ${courseId}`,
            },
          ];
        });
      });
    }

    case ACTIONS.SEND_MESSAGE: {
      return validateRequired(['userId'], action).then(action => {
        const { userId, text, image, audio, type, buttons } = action;

        return users
          .getUser(userId)
          .then(user => {
            return messages
              .send({
                chatId: user.chatId,
                userId,
                type,
                text: cleanMessage(text),
                image,
                audio,
                buttons,
              })
              .then(() => []);
          })
          .catch(err => console.log(`${ACTIONS.SEND_MESSAGE} error:`, err));
      });
    }

    case ACTIONS.ADD_TASKS_ON_TOP: {
      return validateRequired(['userId', 'tasks'], action).then(action => {
        const { userId, tasks } = action;

        return users.addTasksOnTop(userId, tasks).then(() => []);
      });
    }

    case ACTIONS.ADD_TASKS: {
      return validateRequired(['userId', 'tasks'], action).then(action => {
        const { userId, tasks } = action;

        return users.addTasks(userId, tasks).then(() => []);
      });
    }

    case ACTIONS.TICK: {
      return users.getAll().then(allUsers => {
        return (
          allUsers &&
          Promise.all(
            allUsers.map(user => {
              return users.shiftTask(user.id).then(task => {
                if (task) {
                  return convertTaskToAction(task, user.id);
                }
              });
            }),
          )
        );
      });
    }

    default: {
      return Promise.reject('bad action');
    }
  }
}

async function scheduleQueueProcess() {
  try {
    await processActions(ACTIONS_QUEUE);

    pushIntoQueue({
      action: ACTIONS.TICK,
    });

    setTimeout(scheduleQueueProcess, 100);
  } catch (e) {
    console.log('Process actions error:', e);
  }
}

function start() {
  scheduleQueueProcess();
}

module.exports = {
  start,
  pushIntoQueue,
  ACTIONS,
};
