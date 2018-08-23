const create = require('../base');

const gateStore = require('../../models/gate_store');
const {ADD_SUCCESS, UPDATE_SUCCESS, DEL_SUCCESS} = require('../../constants');


module.exports = create({
  method: 'passport.gates',

  async getGates() {
    let ret = await gateStore.getGates(this.ctx.request.query);

    this.makeRes({
      ...ret,
    });
  },

  async addGates() {
    let ret = await gateStore.addGates(this.ctx.request.body);

    this.makeRes({msg: ADD_SUCCESS, n: ret.result.n});
  },

  async updateGates() {
    let ret = await gateStore.updateGates(this.ctx.request.body);

    this.makeRes({msg: UPDATE_SUCCESS, n: ret.result.n});
  },

  async delGates() {
    let ret = await gateStore.delGates(this.ctx.request.query);

    this.makeRes({msg: DEL_SUCCESS, n: ret.result.n});
  }
});
