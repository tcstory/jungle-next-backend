const Joi = require('joi');
const ObjectID = require('mongodb').ObjectID;

const {PAGE_SIZE, DEFAULT_PAGE, ArrayAction} = require('../constants');
const {getQuery, validate, findPage, changeArray} = require('./base');
const getClient = require('./db');

const NAME = 'roles';

class RoleStore {
  constructor() {
    getClient().then(({db}) => {
      this.db = db;
      this.findPage = findPage(this.db.collection(NAME));
    });

    this.getQuery = getQuery;
    this.validate = validate;
    this.changeRoles = changeArray('roles');
  }

  async getRoles(params = {}) {
    let value = this.validate(params, {
      names: Joi.array().items(Joi.string().trim()).default([]),
      nameLike: Joi.string().trim().empty(''),
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
    } else if (value.names.length) {
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

            rolesType: Joi.number()
              .valid([ArrayAction.override, ArrayAction.add, ArrayAction.remove]).default(ArrayAction.override),
            roles: Joi.array().items(Joi.string()).default(null),
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

      num += this.changeRoles(item, data);

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

    return this.db.collection(NAME).updateMany(queryObj, {
      $set: {
        softDelete: Date.now(),
      }
    });
  }

}

module.exports = new RoleStore();
