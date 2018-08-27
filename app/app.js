const Koa = require('koa');
const session = require('koa-session');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const qs = require('koa-qs');
const _logger = require('koa-pino-logger');

const config = require('./config');

const router = require('./router');

const app = qs(new Koa());

app.keys = config.keys;

app.use(session(config.session, app));
app.use(cors());
app.use(bodyParser());

app.use(_logger({
  level: config.logger.level,
  prettyPrint: config.isDebug,
}));

app.use(router.routes()).use(router.allowedMethods());


let port = process.env.PORT || 7020;

app.listen(port);

