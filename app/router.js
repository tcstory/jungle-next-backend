const Router = require('koa-router');

const testCtrl = require('./controllers/test');
const userCtrl = require('./controllers/user');

let router = new Router();

router.get('/test', testCtrl.getSomething);

router.get('/passport/users', userCtrl.getUsers);
router.post('/passport/users', userCtrl.addUsers);
router.put('/passport/users', userCtrl.updateUsers);
router.delete('/passport/users', userCtrl.delUsers);

module.exports = router;
