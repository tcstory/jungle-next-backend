const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const qs = require('koa-qs');
const _logger = require('koa-pino-logger');

const config = require('./config');

const router = require('./router');

const app = qs(new Koa());

app.use(bodyParser());

app.use(_logger({
    level: config.logger.level,
    prettyPrint: config.isDebug,
}));

app.use(router.routes()).use(router.allowedMethods());


let port = process.env.PORT || 7020;

app.listen(port);

