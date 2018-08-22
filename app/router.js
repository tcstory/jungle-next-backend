const Router = require('koa-router');

const testCtrl = require('./controllers/test');
const userCtrl = require('./controllers/user');

let router = new Router();

router.get('/test', testCtrl.getSomething);

router.get('/passport/users', userCtrl.getUsers);
router.post('/passport/users', userCtrl.addUser);
router.put('/passport/users', userCtrl.updateUser);
router.delete('/passport/users', userCtrl.delUser);

module.exports = router;
