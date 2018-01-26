let restify = require('restify');
let registerRoutes = require('./routes');

let server = restify.createServer({
  name: 'Tonguology'
});

const corsMiddleware = require('restify-cors-middleware');

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

registerRoutes(server);

server.listen(process.env.PORT || 9091, function() {
  console.log(`${server.name} listening at ${server.url}`);
});
