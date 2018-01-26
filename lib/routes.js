let tongues = require('./tongues');
let courses = require('./courses');

module.exports = function(server) {

  server.get('/ping', (req, res, next) => {
    res.send(200, {
      status: 'ok',
      pong: (new Date()).toLocaleString()
    });

    return next();
  });

  server.post('/echo', (req, res, next) => {
    res.send(200, {
      status: 'ok',
      data: JSON.parse(req.body.json)
    });

    return next();
  });

  server.get('/tongues', (req, res, next) => {
    res.send(200, {
      status: 'ok',
      data: tongues.tongues
    });

    return next();
  });

  server.get('/tongue/:name/:id', (req, res, next) => {
    console.log('>', req.url);
    const idParam = req.params.id;
    const id = idParam.trim().toLocaleLowerCase();
    const nameParam = req.params.name;
    const tongue = nameParam.trim().toLocaleLowerCase();

    tongues
      .get(tongue, id)
      .then(data => {
        res.send(200, {
          status: 'ok',
          data
        });

        next();
      }, err => {
        if (err.error === 'not found') {
          res.send(404, {
            status: 'error',
            error: 'Id is not found'
          });
        } else {
          res.send(500, {
            status: 'error',
            error: 'Internal server error'
          });
        }

        next();
      });
  });

  server.get('/courses', (req, res, next) => {
    courses
      .getAll('course')
      .then(courses => {
        res.send(200, {
          status: 'ok',
          data: courses
        });
      });

    return next();
  });

  server.get('/course/:id', (req, res, next) => {
    const idParam = req.params.id;
    const id = idParam.trim().toLocaleLowerCase();

    courses
      .get(id)
      .then(course => {
        res.send(200, {
          status: 'ok',
          data: course
        });
      })
      .catch(err => {
        if (err.error === 'not found') {
          res.send(404, {
            status: 'error',
            error: 'Id is not found'
          });
        } else {
          res.send(500, {
            status: 'error',
            error: 'Internal server error'
          });
        }
      });

    return next();
  });

  server.post('/course/:id', (req, res, next) => {
    const idParam = req.params.id;
    const id = idParam.trim().toLocaleLowerCase();

    const data = req.body;

    courses
      .put(id, data)
      .then(course => {
        res.send(200, {
          status: 'ok',
          data: course
        });
      })
      .catch(err => {
        res.send(500, {
          status: 'error',
          error: 'Internal server error'
        });
      });

    return next();
  });

};
