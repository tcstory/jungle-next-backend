const Router = require('koa-router');

const testCtrl = require('./controllers/test');

let router = new Router();

router.get('/test', testCtrl.getSomething);

module.exports = router;
