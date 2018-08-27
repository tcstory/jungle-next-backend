const Joi = require('joi');
const _ = require("lodash");

const create = require('./base');
const config = require('../config');
const userStore = require('../models/user_store');
const sessionStore = require('../models/session_store');

module.exports = create({
  method: 'session',

  async sendCode() {
    const value = this.validate({
      phoneNumber: Joi.number().required(),
    });

    let ret = await userStore.getUsers({phoneNumbers: [value.phoneNumber]});

    // 需要判断这个手机号码对应的用户是否存在,不然会乱发短信出去
    if (ret.total > 0) {
      let code = _.random(1000, 9999);

      await sessionStore.setCode({phoneNumber: value.phoneNumber, code});

      // 我们开发的情况下,就直接发code发送回去,不过禁止在其他环境这么做
      if (!(config.isDebug && process.env.Mode === 'local')) {
        code = -1;
      }

      this.makeRes({
        msg: '发送成功',
        code,
      });

    } else {
      this.makeErrRes({
        msg: '用户不存在',
      });
    }
  },

  async getCurUser() {
    let {userId, name, email} = this.ctx.session;

    this.makeRes({
      userId,
      name,
      email,
    });
  },

  async login() {
    const value = this.validate({
      phoneNumber: Joi.number().required(),
      code: Joi.number().required(),
    });

    if (value) {
      let ret1 = await userStore.getUsers({phoneNumbers: [value.phoneNumber]});

      // Step: 1, 需要判断这个手机号码对应的用户是否存在,不然会乱发短信出去
      if (ret1.total > 0) {
        let ret2 = await sessionStore.getCode(value.phoneNumber);

        let diff = Date.now() - ret2.lastModified;
        // Step: 2, 验证码超过5分钟就算失效了
        if (diff >= (5 * 60 * 1000)) {
          this.makeErrRes({
            msg: '验证码过期'
          });
          // Step:  3, 判断验证码是否正确
        } else if (ret2.code === value.code) {
          this.ctx.session.email = ret1.results[0].email;
          this.ctx.session.name = ret1.results[0].name;
          this.ctx.session.userId = ret1.results[0].userId;

          this.makeRes({
            msg: '登录成功'
          });

          // 登录成功后,避免验证码可以被重复使用
          await sessionStore.setCode({phoneNumber: value.phoneNumber, code: _.random(1000, 9999)});
        } else {
          this.makeErrRes({
            msg: '验证码不正确'
          });
        }
      } else {
        this.makeErrRes({
          msg: '用户不存在'
        });
      }
    }
  },

  async logout() {
    this.ctx.session = null;

    this.makeRes({
      msg: '登出成功'
    });
  },

});
