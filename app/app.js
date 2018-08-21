const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const qs = require('koa-qs');
const logger = require('koa-pino-logger');

const config = require('./config');

const router = require('./router');

process.on('unhandledRejection', (reason, p) => {
    console.error(Date.now(), reason, 'Unhandled Rejection at Promise', p);
}).on('uncaughtException', err => {
    console.error(Date.now(), err);
    process.exit(1);
});

const app = qs(new Koa());

app.use(bodyParser());

app.use(logger({
    level: config.logger.level,
}));

app.use(router.routes()).use(router.allowedMethods());


let port = process.env.PORT || 7020;

app.listen(port);

