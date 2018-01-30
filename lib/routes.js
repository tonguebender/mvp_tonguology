const db = require('./db');
const users = require('./users');

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
  server.get('/ping', (req, res, next) => {
    sendOk(res, { pong: (new Date()).toLocaleString() });

    return next();
  });

  server.post('/echo', (req, res, next) => {
    sendOk(res, req.body);

    return next();
  });

  server.post('/user/:id', (req, res, next) => {
    // todo: params validation
    const idParam = req.params.id;
    const id = idParam.trim().toLocaleLowerCase();
    const data = req.body;

    users.create(id, data)
      .then((user) => {
        sendOk(res, user);

        next();
      }, (error) => {
        sendError(res, error);

        next();
      });
  });

  server.post('/subscription', (req, res, next) => {
    // todo: params validation
    const data = req.body;
    const { userId, courseId } = data;

    users.addTasks(userId, courseId)
      .then((user) => {
        sendOk(res, user);

        next();
      }, (error) => {
        sendError(res, error);

        next();
      });
  });

  server.get('/tick', (req, res, next) => {
    users.processTasks()
      .then(result => {
        sendOk(res, result);

        next();
      }, error => {
        sendError(res, error);

        next();
      });
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
