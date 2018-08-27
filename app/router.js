const Router = require('koa-router');

const testCtrl = require('./controllers/test');
const sessionCtrl = require('./controllers/sessions');
const userCtrl = require('./controllers/passport/user');
const roleCtrl = require('./controllers/passport/roles');
const gateCtrl = require('./controllers/passport/gates');
const managerCtrl = require('./controllers/passport/managers');

let router = new Router();

router.get('/test', testCtrl.getSomething);

router.get('/sessions', sessionCtrl.getCurUser);
router.post('/sessions/code', sessionCtrl.sendCode);
router.post('/sessions', sessionCtrl.login);
router.delete('/sessions', sessionCtrl.logout);

router.get('/passport/users', userCtrl.getUsers);
router.post('/passport/users', userCtrl.addUsers);
router.put('/passport/users', userCtrl.updateUsers);
router.delete('/passport/users', userCtrl.delUsers);

router.get('/passport/roles', roleCtrl.getRoles);
router.post('/passport/roles', roleCtrl.addRoles);
router.put('/passport/roles', roleCtrl.updateRoles);
router.delete('/passport/roles', roleCtrl.delRoles);

router.get('/passport/gates', gateCtrl.getGates);
router.post('/passport/gates', gateCtrl.addGates);
router.put('/passport/gates', gateCtrl.updateGates);
router.delete('/passport/gates', gateCtrl.delGates);

router.get('/passport/managers', managerCtrl.getManagers);
router.post('/passport/managers', managerCtrl.addManagers);
router.put('/passport/managers', managerCtrl.updateManagers);
router.delete('/passport/managers', managerCtrl.delManagers);

module.exports = router;
