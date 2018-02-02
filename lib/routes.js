const db = require('./db');
const { processActions } = require('./actions');

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

  registerPost('/user/:id', (params, body) => {
    const idParam = params.id;
    const id = idParam.trim().toLocaleLowerCase();

    return [{
      action: 'CREATE_USER',
      userId: id,
      data: body
    }];
  });

  registerPost('/message', (params, body) => {
    const idParam = body.id;
    const id = idParam.trim().toLocaleLowerCase();
    const textParam = body.text;
    const text = textParam.trim().toLocaleLowerCase();

    return [{
      action: 'USER_MESSAGE',
      user: id,
      text: text
    }];
  });

  registerPost('/subscription', (params, body) => {
    const { userId, courseId } = body;

    return [{
      action: 'SUBSCRIBE',
      user: userId,
      course: courseId
    }];
  });

  registerPost('/tick', () => {
    return [{
      action: 'TICK',
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
