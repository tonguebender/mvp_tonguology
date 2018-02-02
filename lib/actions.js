const users = require('./users');
const courses = require('./courses');
const messages = require('./messages');

function processActions(actions) {
  if (!Array.isArray(actions)) throw new Error(`actions must be an array, instead got ${typeof actions}`);

  if (actions.length === 0) return Promise.resolve('ok');

  return Promise.all(actions.map(action => {
    if (!action) return;

    switch (action.action) {

      case 'CREATE_USER': {
        const { userId, data } = action;

        return users.create(userId, data)
          .then(user => {
            return courses.getAll()
              .then(courses => {
                return { user, courses }
              });
          })
          .then(({ user, courses }) => {
            const { id } = user;

            return [
              {
                action: 'SEND_MESSAGE',
                user: id,
                text: `Hi user!`
              },
              {
                action: 'SEND_MESSAGE',
                user: id,
                text: `Here some courses for you: ${courses.toString()}`
              },
              {
                action: 'ADD_TASK_TO_TOP',
                user: id,
                taskData: {
                  type: 'WAIT_ANSWER',
                  options: {
                    command: 'subscribe'
                  },
                }
              }
            ]
          });
      }

      case 'SEND_MESSAGE': {
        const { user, text } = action;

        return messages
          .send({
            user,
            text
          })
          .then(() => []);
      }

      case 'ADD_TASK_TO_TOP': {
        const { user, taskData } = action;

        return users
          .addTaskOnTop(user, taskData)
          .then(() => []);
      }

      case 'ADD_TASKS': {
        const { user, tasks } = action;

        return users
          .addTasks(user, tasks)
          .then(() => []);
      }

      case 'USER_MESSAGE': {
        const { user, text } = action;

        return users.shiftWaitForAnswerTask(user)
          .then(task => {
            if (task) return convertTaskToAction(task, user, text);

            return [
              {
                action: 'SEND_MESSAGE',
                user,
                text: `I do not know how to help with this` // todo: randomize answers
              }
            ];
          });
      }

      case 'SUBSCRIBE': {
        const { user, course } = action;

        return courses.getTasks(course)
          .then(tasks => {
            return [
              {
                action: 'ADD_TASKS',
                user,
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
                action: 'SEND_MESSAGE',
                user,
                text: `You are know subscribed to: ${course}`
              }
            ]
          });
      }

      case 'TICK': {
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
    });
}

function convertTaskToAction(task, user, text) {
  switch (task.type) {
    case 'WAIT_ANSWER': {
      const command = task.options.command;

      switch (command) {
        case 'subscribe':
          return {
            action: 'SUBSCRIBE',
            user: user,
            course: text
          };
        default:
          throw new Error(`Unknown command ${command}`);
      }
    }
    case 'LEARN': {
      return {
        action: 'SEND_MESSAGE',
        user: user,
        text: `Learn ${task.options.entity}`
      }
    }
  }
}

module.exports = {
  processActions
};
