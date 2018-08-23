const create = require('../base');

const {ADD_SUCCESS, UPDATE_SUCCESS, DEL_SUCCESS} = require('../../constants');
const managerStore = require('../../models/manager_store');


module.exports = create({
    method: 'passport.managers',

    async getManagers() {
        let ret = await managerStore.getManagers(this.ctx.request.query);

        this.makeRes({
            ...ret,
        });
    },

    async addManagers() {
        let ret = await managerStore.addManagers(this.ctx.request.body);

        this.makeRes({msg: ADD_SUCCESS, n: ret.result.n});
    },

    async updateManagers() {
        let ret = await managerStore.updateManagers(this.ctx.request.body);

        this.makeRes({msg: UPDATE_SUCCESS, n: ret.result.n});
    },

    async delManagers() {
        let ret = await managerStore.delManagers(this.ctx.request.query);

        this.makeRes({msg: DEL_SUCCESS, n: ret.result.n});
    }
});
