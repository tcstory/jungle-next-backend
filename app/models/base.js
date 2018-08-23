const Joi = require('joi');
const _ = require('lodash');

const {ArrayAction} = require('../constants');

exports.findPage = function findPage(collection) {

  return function (...args) {
    let {page, pageSize} = args[0];

    delete args[0].page;
    delete args[0].pageSize;

    let p = collection.find(args[0]).project(args[1]);

    if (pageSize !== -1) {
      p = p.skip((page - 1) * pageSize).limit(pageSize);
    }

    return Promise.all([
      p.sort({_id: -1}).toArray(),
      collection.count(args[0])
    ]).then(function (bodies) {
      return {
        results: bodies[0],
        total: bodies[1]
      };
    });
  }
};

exports.getQuery = function getQuery() {
  return {
    softDelete: 0,
  }
};

exports.validate = function validate(params, schema) {
  let valid = Joi.validate(params, schema);

  if (valid.error) {
    throw new Error(valid.error.toString());
  } else {
    return valid.value;
  }
};

exports.changeArray = function (filedName) {
  let field1 = filedName;
  let field2 = `${filedName}Type`;

  return function (item, data) {
    if (item.data[field1] && item.data[field1].length) {
      if (value[field2] === ArrayAction.override) {
        _.set(data, `$set.${field1}`, item.data[field1])
      } else if (value[field2] === ArrayAction.add) {
        _.set(data, `$addToSet.${field1}`, {
          $each: item.data[field1],
        });
      } else {
        _.set(data, `$pullAll.${field1}`, item.data[field1])
      }
      return 1;
    } else {
      return 0;
    }
  }
};
