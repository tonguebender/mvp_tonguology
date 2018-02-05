const db = require('./db');
const { processActions, ACTIONS } = require('./actions');
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
      return processActions(actionCreator(req.params, req.body))
        .then(ok => {
          sendOk(res, ok);

          next();
        }, error => {
          sendError(res, error);

          next();
        });

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
    const id = idParam.trim().toLocaleLowerCase();
    const { name, chatId, fullInfo } = body;

    return [{
      action: ACTIONS.CREATE_USER,
      userId: id,
      data: {
        name,
        chatId,
        fullInfo,
      }
    }];
  });

  registerPost('/user_message', (params, body) => {
    const idParam = body.id;
    const id = idParam && idParam.trim().toLocaleLowerCase();
    const textParam = body.text;
    const text = textParam && textParam.trim().toLocaleLowerCase();

    return [{
      action: ACTIONS.USER_MESSAGE,
      userId: id,
      text: text
    }];
  });

  registerPost('/subscription', (params, body) => {
    const { userId, courseId } = body;

    return [{
      action: ACTIONS.SUBSCRIBE,
      userId: userId,
      course: courseId
    }];
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
