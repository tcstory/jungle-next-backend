const create = require('../base');

const {ADD_SUCCESS, UPDATE_SUCCESS, DEL_SUCCESS} = require('../../constants');
const userStore = require('../../models/user_store');


module.exports = create({
    method: 'passport.user',

    async getUsers() {
        let ret = await userStore.getUsers(this.ctx.request.query);

        this.makeRes({
            ...ret,
        });
    },

    async addUsers() {
        let ret = await userStore.addUsers(this.ctx.request.body);

        this.makeRes({msg: ADD_SUCCESS, n: ret.result.n});
    },

    async updateUsers() {
        let ret = await userStore.updateUsers(this.ctx.request.body);

        this.makeRes({msg: UPDATE_SUCCESS, n: ret.result.n});
    },

    async delUsers() {
        let ret = await userStore.delUsers(this.ctx.request.query);

        this.makeRes({msg: DEL_SUCCESS, n: ret.result.n});
    }
});
