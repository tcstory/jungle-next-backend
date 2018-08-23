const Joi = require('joi');
const _ = require('lodash');

const {DEFAULT_PAGE, PAGE_SIZE, ArrayAction} = require('../constants');
const {getQuery, validate, findPage, changeArray} = require('./base');
const getClient = require('./db');

const NAME = 'managers';

const Type = {
  root: 1,
  other: 2,
};

class ManagerStore {
  constructor() {
    getClient().then(({db}) => {
      this.db = db;
      this.findPage = findPage(this.db.collection(NAME));
    });

    this.getQuery = getQuery;
    this.validate = validate;
    this.changeUsers = changeArray('users');
    this.changeRoles = changeArray('roles');
    this.changeGates = changeArray('gates');
  }

  async getManagers(params = {}) {
    let value = this.validate(params, {
      Ids: Joi.array().items(Joi.string().trim()).empty('').default([]),
      nameLike: Joi.string().trim().empty(''),
      names: Joi.array().items(Joi.string().trim()).default([]),

      page: Joi.number().default(DEFAULT_PAGE),
      pageSize: Joi.number().default(PAGE_SIZE),
    });

    let queryObj = this.getQuery();
    queryObj.page = value.page;
    queryObj.pageSize = value.pageSize;

    if (value.Ids.length) {
      queryObj._id = {
        $in: value.Ids.map(function (item) {
          return ObjectID(item);
        })
      };
    }

    if (value.nameLike) {
      queryObj.name = new RegExp(value.nameLike);
    } else if (value.names.length) {
      queryObj.name = {
        $in: value.names,
      };
    }

    return this.findPage(queryObj, {_id: 0, softDelete: 0});
  }

  async addManagers(params) {
    let value = this.validate(params, {
      managers: Joi.array().items({
        type: Joi.number().default(Type.other),
        name: Joi.string().trim().required(),
        users: Joi.array().items(Joi.string()).default([]),
        roles: Joi.array().items(Joi.string()).default([]),
        gates: Joi.array().items(Joi.string()).default([]),
      }).min(1).required(),
    });

    let now = Date.now();

    let list = [];

    for (let item of value.managers) {
      list.push({
        ...item,
        updatedAt: now,
        createdAt: now,
        softDelete: 0,
      });
    }

    return this.db.collection(NAME).insertMany(list);
  }

  async updateManagers(params) {
    let value = this.validate(params, {
      managers: Joi.array().items({
        id: Joi.string().trim().required(),
        data: Joi.object().keys({
          name: Joi.string().trim().default(''),

          usersType: Joi.number()
            .valid([ArrayAction.override, ArrayAction.add, ArrayAction.remove]).default(ArrayAction.override),
          users: Joi.array().items(Joi.string()).default(null),

          rolesType: Joi.number()
            .valid([ArrayAction.override, ArrayAction.add, ArrayAction.remove]).default(ArrayAction.override),
          roles: Joi.array().items(Joi.string()).default(null),

          gatesType: Joi.number()
            .valid([ArrayAction.override, ArrayAction.add, ArrayAction.remove]).default(ArrayAction.override),
          gates: Joi.array().items(Joi.string()).default(null),
        }).default({}),
      }).min(1).required(),
    });

    let works = [];

    for (let item of value.managers) {
      let queryObj = this.getQuery();
      queryObj._id = ObjectID(item.id);

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

      num += this.changeGates(item, data);

      num += this.changeRoles(item, data);

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

  async delManagers(params) {
    let value = this.validate(params, {
      ids: Joi.array().items(Joi.string().trim()).min(1).required(),
    });

    let queryObj = this.getQuery();

    queryObj._id = {
      $in: value.ids.map(function (item) {
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

module.exports = new ManagerStore();
