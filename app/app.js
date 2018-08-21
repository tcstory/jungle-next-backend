const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const qs = require('koa-qs');
const logger = require('koa-pino-logger');

const config = require('./config');

const testCtrl = require('./controllers/test');

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

let router = new Router();

router.get('/test', testCtrl.getSomething);

app.use(router.routes()).use(router.allowedMethods());


let port = process.env.PORT || 7020;

app.listen(port);

