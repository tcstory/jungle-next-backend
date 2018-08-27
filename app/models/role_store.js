const Joi = require('joi');

const {ArrayAction} = require('../constants');
const {getQuery, validate, changeArray} = require('./base');
const getClient = require('./db');

const commonStore = require('./common_store');

const NAME = 'roles';

class RoleStore {
  constructor() {
    getClient().then(({db}) => {
      this.db = db;
    });

    this.getQuery = getQuery;
    this.validate = validate;
    this.changeUsers = changeArray('users');
  }

  async getRoles(params = {}) {
    return commonStore.getRoles(params);
  }

  async addRoles(params) {
    let value = this.validate(params, {
      roles: Joi.array().items({
        name: Joi.string().required(),
        users: Joi.array().items(Joi.string()).default([]),
      }).min(1).required(),
    });

    let now = Date.now();

    let list = [];

    for (let item of value.roles) {
      list.push({
        ...item,
        updatedAt: now,
        createdAt: now,
        softDelete: 0,
      });
    }

    return this.db.collection(NAME).insertMany(list);
  }

  async updateRoles(params) {
    let value = this.validate(params, {
      roles: Joi.array().items(
        {
          roleId: Joi.string().required(),
          data: Joi.object().keys({
            name: Joi.string().trim().default(''),

            usersType: Joi.number()
              .valid([ArrayAction.override, ArrayAction.add, ArrayAction.remove]).default(ArrayAction.override),
            users: Joi.array().items(Joi.string()).default(null),
          }).default({}),
        }
      )
    });

    let works = [];

    for (let item of value.roles) {
      let queryObj = this.getQuery();
      queryObj._id = ObjectID(item.roleId);

      let data = {
        $set: {
          updatedAt: Date.now(),
        },
      };

      let num = 0;

      if (item.data.name) {
        num++;
        data.$set.name = item.data.name;
      }

      num += this.changeUsers(item, data);

      if (num > 0) {
        works.push(
          this.db.collection(NAME).updateOne(queryObj, data)
        );
      }

    }

    if (works.length) {
      return Promise.all(works).then(function (ret) {
        let n = 0;
        ret.forEach(function (item) {
          n += item.result.n;
        });

        return {
          result: {n,}
        }
      });
    } else {
      return {
        result: {n: 0}
      }
    }
  }

  async delRoles(params) {
    let value = this.validate(params, {
      roleIds: Joi.array().items(Joi.string().trim()).min(1).required(),
    });

    let queryObj = this.getQuery();

    queryObj._id = {
      $in: value.roleIds.map(function (item) {
        return ObjectID(item);
      })
    };

    let works = [];

    for (let roleId of value.roleIds) {
      works.push(
        commonStore.clearRoleOfGate(roleId)
      );
      works.push(
        commonStore.clearRoleOfManager(roleId)
      );
    }

    await Promise.all(works);

    return this.db.collection(NAME).updateMany(queryObj, {
      $set: {
        softDelete: Date.now(),
      }
    });
  }

  /**
   * 删掉所有匹配到的角色里的用户
   * @return {Promise}
   */
  clearUser(userId) {
    return commonStore.clearUserOfRole(userId);
  }
}

module.exports = new RoleStore();
