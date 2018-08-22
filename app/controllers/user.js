const create = require('./base');

const user_store = require('../models/user_store');

const ADD_SUCCESS = '添加成功';
const UPDATE_SUCCESS = '修改成功';
const DEL_SUCCESS = '删除成功';

module.exports = create({
    method: 'user',

    async getUsers() {
        let ret = await user_store.getUsers(this.ctx.request.query);

        this.makeRes({
            ...ret,
        });
    },

    async addUser() {
        let ret = await user_store.addUsers(this.ctx.request.body);

        this.makeRes({msg: ADD_SUCCESS, n: ret.result.n});
    },

    async updateUser() {
        let ret = await user_store.updateUsers(this.ctx.request.body);

        this.makeRes({msg: UPDATE_SUCCESS, n: ret.result.n});
    },

    async delUser() {
        let ret = await user_store.delUsers(this.ctx.request.query);

        this.makeRes({msg: DEL_SUCCESS, n: ret.result.n});
    }
});
