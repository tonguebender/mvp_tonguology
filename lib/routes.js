const db = require('./db');
const userRoute = require('./route-user');

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
          sendOk(res, req.body);

          return next();
        });

        server.post('/user/:id', (req, res, next) => {
          const idParam = req.params.id;
          const id = idParam.trim().toLocaleLowerCase();
          const data = req.body;

          userRoute.create(id, data)
            .then((user) => {
              sendOk(res, user);

              next();
            }, (error) => {
              sendError(res, error);

              next();
            });
        });

        resolve();
      })
      .catch(reject);
  });

};
