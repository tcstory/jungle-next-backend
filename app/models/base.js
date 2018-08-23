const Joi = require('joi');

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
