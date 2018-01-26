const restify = require('restify');
const registerRoutes = require('./routes');

const server = restify.createServer({
  name: 'Tonguology'
});

const corsMiddleware = require('restify-cors-middleware');

// todo: implement logging
server.use((req, res, next) => {
  console.log(`> ${req.method} ${req.url}`);
  next();
});


const cors = corsMiddleware({
  preflightMaxAge: 5,
  origins: ['*'],
  allowHeaders: ['API-Token'],
  exposeHeaders: ['API-Token-Expiry']
});

server.pre(cors.preflight);
server.use(cors.actual);

server.use(restify.plugins.bodyParser());

// todo: replace default error response

registerRoutes(server)
  .then(() => {
    server.listen(process.env.PORT || 9091, function() {
      console.log(`${server.name} listening at ${server.url}`);
    });
  });

