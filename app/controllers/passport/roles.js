const create = require('../base');

const roleStore = require('../../models/role_store');
const {ADD_SUCCESS, UPDATE_SUCCESS, DEL_SUCCESS} = require('../../constants');


module.exports = create({
  method: 'passport.roles',

  async getRoles() {
    let ret = await roleStore.getRoles(this.ctx.request.query);

    this.makeRes({
      ...ret,
    });
  },

  async addRoles() {
    let ret = await roleStore.addRoles(this.ctx.request.body);

    this.makeRes({msg: ADD_SUCCESS, n: ret.result.n});
  },

  async updateRoles() {
    let ret = await roleStore.updateRoles(this.ctx.request.body);

    this.makeRes({msg: UPDATE_SUCCESS, n: ret.result.n});
  },

  async delRoles() {
    let ret = await roleStore.delRoles(this.ctx.request.query);

    this.makeRes({msg: DEL_SUCCESS, n: ret.result.n});
  }
});
