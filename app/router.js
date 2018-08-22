const Router = require('koa-router');

const testCtrl = require('./controllers/test');
const userCtrl = require('./controllers/user');

let router = new Router();

router.get('/test', testCtrl.getSomething);

router.post('/users', userCtrl.postSomething);

module.exports = router;
