const Joi = require('joi');
const _ = require('lodash');
const ObjectID = require('mongodb').ObjectID;

const getClient = require('./db');
const {validate, getQuery, findPage} = require('./base');
const {PAGE_SIZE, DEFAULT_PAGE} = require('../constants');

const ROLE_NAME = 'roles';
const GATE_NAME = 'gates';
const MANAGER_NAME = 'managers';

function clearItemOfThat(name, field) {
  return function (id) {
    let value = this.validate(id, Joi.string().required());

    let queryObj = {
      [field]: {
        $in: [value]
      },
      ...this.getQuery()
    };

    let obj = {
      $set: {
        updatedAt: Date.now(),
      },
      $pull: {
        [field]: value,
      }
    };

    return this.db.collection(name).updateMany(queryObj, obj);
  }
}

function CommonStore() {
  getClient().then(({db}) => {
    this.db = db;
    this.findRolePage = findPage(this.db.collection(ROLE_NAME));
    this.findGatePage = findPage(this.db.collection(GATE_NAME));
  });
}

CommonStore.prototype.validate = validate;

CommonStore.prototype.getQuery = getQuery;

CommonStore.prototype.getRoles = function (params = {}) {
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

  return this.findRolePage(queryObj, {softDelete: 0});
};

CommonStore.prototype.getGates = function (params = {}) {
  let value = this.validate(params, {
    nameLike: Joi.string().trim().empty(''),
    names: Joi.array().items(Joi.string().trim()).default([]),
    gateIds: Joi.array().items(Joi.string()).default([]),
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
    queryObj.roles = {
      $in: value.roleIds,
    };
  }

  if (value.userIds.length) {
    queryObj.users = {
      $in: value.userIds,
    }
  }

  if (value.gateIds.length) {
    queryObj._id = {
      $in: value.gateIds.map(function (item) {
        return ObjectID(item);
      })
    };
  }

  return this.findGatePage(queryObj, {softDelete: 0});
};

/**
 * 删掉所有匹配到的角色里的用户
 * @param userId String
 * @return {Promise}
 */
CommonStore.prototype.clearUserOfRole = clearItemOfThat(ROLE_NAME, 'users');

/**
 * 删掉所有匹配到的权限配置里的用户
 * @param userId String
 * @return {Promise}
 */
CommonStore.prototype.clearUserOfGate = clearItemOfThat(GATE_NAME, 'users');

/**
 * 删掉所有匹配到的manager里的用户
 * @param userId String
 * @return {Promise}
 */
CommonStore.prototype.clearUserOfManager = clearItemOfThat(MANAGER_NAME, 'users');

/**
 * 删掉所有匹配到的权限配置里的角色
 * @param roleId String
 * @return {Promise}
 */
CommonStore.prototype.clearRoleOfGate = clearItemOfThat(GATE_NAME, 'roles');

/**
 * 删掉所有匹配到的manager里的角色
 * @param roleId String
 * @return {Promise}
 */
CommonStore.prototype.clearRoleOfManager = clearItemOfThat(MANAGER_NAME, 'roles');

/**
 * 删掉所有匹配到的manager里的权限配置
 * @param gateId String
 * @return {Promise}
 */
CommonStore.prototype.clearGateOfManager = clearItemOfThat(MANAGER_NAME, 'gates');

/**
 * 返回一个用户有权限访问哪几个权限配置
 * @return {Promise}
 */
CommonStore.prototype.getUserAccessGates = async function (userId) {
  let value = this.validate(userId, Joi.string().required());

  // 从两个维度去查询这个数据,
  // 1. 判断权限配置的users字段
  // 2. 判断权限配置的roles字段

  let roleIds = await this.getRoles({
    userIds: [value],
    pageSize: -1,
  }).then(ret => ret.results.map(function (item) {
    return item._id.toString();
  }));

  let results1 = await this.getGates({
    userIds: [value],
    pageSize: -1,
  }).then(ret => ret.results.map(function (item) {
    return {
      ...item,
      _id: item._id.toString(),
    }
  }));

  let results2 = [];

  if (roleIds.length) {
    results2 = await this.getGates({
      roleIds,
      pageSize: -1,
    }).then(ret => ret.results.map(function (item) {
      return {
        ...item,
        _id: item._id.toString(),
      }
    }));
  }
  let results = _.uniq(results1.concat(results2), '_id');

  return {
    results,
    total: results.length,
  }
};

module.exports = new CommonStore();
