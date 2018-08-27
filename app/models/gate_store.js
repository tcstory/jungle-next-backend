const Joi = require('joi');
const ObjectID = require('mongodb').ObjectID;

const {ArrayAction} = require('../constants');
const {getQuery, validate, changeArray} = require('./base');
const getClient = require('./db');
const commonStore = require('./common_store');

const NAME = 'gates';

const Type = {
  lv1: 1,
  lv2: 2,
  lv3: 3,
};

class GateStore {
  constructor() {
    getClient().then(({db}) => {
      this.db = db;
    });

    this.getQuery = getQuery;
    this.validate = validate;
    this.changeUsers = changeArray('users');
    this.changeRoles = changeArray('roles');
    this.changeChildren = changeArray('children');
  }

  async getGates(params = {}) {
    return commonStore.getGates(params);
  }

  async addGates(params) {
    let value = this.validate(params, {
      gates: Joi.array().items({
        name: Joi.string().trim().required(),
        type: Joi.number().default(Type.lv1),
        action: Joi.string().trim().required(),
        children: Joi.array().items(Joi.string()).default([]),
        users: Joi.array().items(Joi.string()).default([]),
        roles: Joi.array().items(Joi.string()).default([]),
      }).min(1).required(),
    });

    let now = Date.now();

    let list = [];

    for (let item of value.gates) {
      list.push({
        ...item,
        updatedAt: now,
        createdAt: now,
        softDelete: 0,
      });
    }

    return this.db.collection(NAME).insertMany(list);
  }

  async updateGates(params) {
    let validArr = [ArrayAction.override, ArrayAction.add, ArrayAction.remove];

    let value = this.validate(params, {
      gates: Joi.array().items(
        {
          gateId: Joi.string().required(),
          data: Joi.object().keys({
            name: Joi.string().trim().default(''),
            type: Joi.number().default(''),

            childrenType: Joi.number()
              .valid(validArr).default(ArrayAction.override),
            children: Joi.array().items(Joi.string()).default(null),

            usersType: Joi.number()
              .valid(validArr).default(ArrayAction.override),
            users: Joi.array().items(Joi.string()).default(null),

            rolesType: Joi.number()
              .valid(validArr).default(ArrayAction.override),
            roles: Joi.array().items(Joi.string()).default(null),
          }).default({}),
        }
      )
    });

    let works = [];

    for (let item of value.gates) {
      let queryObj = this.getQuery();
      queryObj._id = ObjectID(item.gateId);

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

      if (item.data.type) {
        num++;
        data.$set.type = item.data.type;
      }

      num += this.changeRoles(item, data);

      num += this.changeUsers(item, data);

      num += this.changeChildren(item, data);


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

  async delGates(params) {
    let value = this.validate(params, {
      gateIds: Joi.array().items(Joi.string()).min(1).required(),
    });

    let queryObj = this.getQuery();

    queryObj._id = {
      $in: value.gateIds.map(function (item) {
        return ObjectID(item);
      })
    };

    let works = [];

    for (let gateId of value.gateIds) {
      works.push(
        commonStore.clearGateOfManager(gateId)
      );
    }

    await Promise.all(works);

    return this.db.collection(NAME).updateMany(queryObj, {
      $set: {
        softDelete: Date.now(),
      }
    });
  }

  getUserAccessGates(userId) {
    return commonStore.getUserAccessGates(userId);
  }

  /**
   * 删掉所有匹配到的权限配置里的角色
   * @param roleId String
   * @return {Promise}
   */
  clearRole(roleId) {
    return commonStore.clearRoleOfGate(roleId);
  }

  /**
   * 删掉所有匹配到的权限配置里的用户
   * @param userId String
   * @return {Promise}
   */
  clearUser(userId) {
    return commonStore.clearUserOfGate(userId);
  }

}

module.exports = new GateStore();
