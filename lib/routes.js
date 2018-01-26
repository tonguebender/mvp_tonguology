const db = require('./db');

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

module.exports = function(server) {

  return new Promise((resolve, reject) => {
    db
      .getConnection()
      .then(() => {
        server.get('/ping', (req, res, next) => {
          sendOk(res, { pong: (new Date()).toLocaleString() });

          return next();
        });

        server.post('/echo', (req, res, next) => {
          sendOk(res, JSON.parse(req.body.json));

          return next();
        });

        resolve();
      })
      .catch(reject);
  });

};
