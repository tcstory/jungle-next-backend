const Joi = require('joi');
const ObjectID = require('mongodb').ObjectID;

const {PAGE_SIZE, DEFAULT_PAGE} = require('../constants');
const {getQuery, validate, findPage} = require('./base');
const getClient = require('./db');

const NAME = 'gates';

class GateStore {
  constructor() {
    getClient().then(({db}) => {
      this.db = db;
      this.findPage = findPage(this.db.collection(NAME));
    });

    this.getQuery = getQuery;
    this.validate = validate;
  }

  async getGates(params = {}) {
    let value = this.validate(params, {
      nameLike: Joi.string().trim().empty(''),
      names: Joi.array().items(Joi.string().trim()).default([]),
      roleIds: Joi.array().items(Joi.string()).default([]),
      userIds: Joi.array().items(Joi.string()).default([]),

      page: Joi.number().default(DEFAULT_PAGE),
      pageSize: Joi.number().default(PAGE_SIZE),
    });

    let queryObj = this.getQuery();

    queryObj.page = value.page;
    queryObj.pageSize = value.pageSize;

    if (value.nameLike) {
      queryObj.name = new RegExp(value.nameLike);
    } else if (value.names) {
      queryObj.name = {
        $in: value.names,
      };
    }

    if (value.roleIds.length) {
      queryObj._id = {
        $in: value.roleIds.map(function (item) {
          return ObjectID(item);
        })
      };
    }

    if (value.userIds.length) {
      queryObj.users = {
        $in: value.userIds,
      }
    }


    return this.findPage(queryObj, {_id: 0, softDelete: 0});
  }

  async addGates(params) {
    let value = this.validate(params, {
      gates: Joi.array().items({
        name: Joi.string().trim().required(),
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
    let value = this.validate(params, {
      gates: Joi.array().items(
        {
          gateId: Joi.string().required(),
          data: Joi.object().keys({
            name: Joi.string().trim().default(''),
            users: Joi.array().items(Joi.string()).default(null),
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

      // 这里先不检查roles里面的roleId是否合法把.
      if (item.data.roles && item.data.roles.length) {
        num++;
        data.$set.roles = item.data.roles;
      }

      // 这里先不检查users里面的userId是否合法把.
      if (item.data.users && item.data.users.length) {
        num++;
        data.$set.users = item.data.users;
      }

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
      $in: value.roleIds.map(function (item) {
        return ObjectID(item);
      })
    };

    return this.db.collection(NAME).updateMany(queryObj, {
      $set: {
        softDelete: Date.now(),
      }
    });
  }

}

module.exports = new GateStore();
