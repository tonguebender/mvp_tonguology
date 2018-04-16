const db = require('./db');
const { pushIntoQueue } = require('./actions');
const { ACTIONS } = require('./consts');
const messages = require('./messages');

function sendOk(res, data) {
  res.send(200, {
    status: 'ok',
    data
  });
}

function sendError(res, error, errorCode = 500) {
  res.send(errorCode, {
    status: 'error',
    error
  });
}

function _createRoutes(server) {

  function registerPost(route, actionCreator) {
    server.post(route, (req, res, next) => {
      pushIntoQueue(actionCreator(req.params, req.body));

      sendOk(res, 'ok');
      next();
    });
  }

  server.get('/ping', (req, res, next) => {
    sendOk(res, { pong: (new Date()).toLocaleString() });

    return next();
  });

  server.post('/echo', (req, res, next) => {
    sendOk(res, req.body);

    return next();
  });

  server.get('/get_new_messages', (req, res, next) => {
    return messages.getNew()
      .then(messages => {
        sendOk(res, messages);

        next();
      });
  });

  server.post('/mark_as_sent', (req, res, next) => {
    return messages.markAsSent(req.body.messages)
      .then(messages => {
        sendOk(res, messages);

        next();
      });
  });

  registerPost('/user/:id', (params, body) => {
    const idParam = params.id;
    const id = idParam && idParam.trim().toLocaleLowerCase();
    const { name, chatId, fullInfo } = body;

    return [{
      action: ACTIONS.USER_COMMAND_START,
      userId: id,
      name,
      chatId,
      fullInfo,
    }];
  });

  registerPost('/user_message', (params, body) => {
    const idParam = body.id;
    const id = idParam && idParam.trim().toLocaleLowerCase();
    const { name, chatId, fullInfo, text } = body;

    return [{
      action: ACTIONS.USER_MESSAGE,
      userId: id,
      text,
      name,
      chatId,
      fullInfo,
    }];
  });

  registerPost('/subscription', (params, body) => {
    const { userId, courseId } = body;

    return [{
      action: ACTIONS.USER_COMMAND_SUBSCRIBE,
      userId,
      courseId,
    }];
  });

  registerPost('/unsubscribe', (params, body) => {
    const { userId, courseId } = body;

    return [{
      action: ACTIONS.USER_COMMAND_UNSUBSCRIBE,
      userId,
      courseId,
    }];
  });

  registerPost('/call_action', (params, body) => {
    const { userId, action, text } = body;

    switch (action) {
      case 'quizzes': {
        return [{
          action: ACTIONS.USER_COMMAND_QUIZZES,
          userId
        }];
      }
      case 'quiz': {
        return [{
          action: ACTIONS.USER_COMMAND_QUIZ,
          userId,
          quizId: text,
        }];
      }
      case 'stop': {
        return [{
          action: ACTIONS.USER_COMMAND_STOP,
          userId
        }];
      }
      case 'define': {
        return [{
          action: ACTIONS.USER_COMMAND_DEFINE,
          userId,
          text
        }];
      }
      default: {
        console.log('Unsupported action:', action);
      }
    }
  });

  registerPost('/tick', () => {
    return [{
      action: ACTIONS.TICK,
    }];
  });

}

module.exports = function(server) {

  return new Promise((resolve, reject) => {
    db
      .getConnection()
      .then(() => {

        _createRoutes(server);

        resolve();
      })
      .catch(reject);
  });

};
