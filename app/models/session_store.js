const Joi = require('joi');

const getClient = require('./db');
const {validate} = require('./base');

const NAME = 'sessions';

class SessionStore {
  constructor() {
    getClient().then(({db}) => {
      this.db = db;
      this.collection = this.db.collection(NAME);
    });
    this.validate = validate;
  }

  getCode(phoneNumber) {
    let value = this.validate(phoneNumber, Joi.number().required());

    return this.collection.find({
      phoneNumber: value,
    }).toArray().then(function (docs) {
      if (docs.length > 0) {
        return docs[0];
      } else {
        return null;
      }
    });
  }

  setCode(params) {
    let value = this.validate(params, {
      phoneNumber: Joi.number().required(),
      code: Joi.number().required(),
    });

    let {phoneNumber, code} = value;

    return this.collection.update({
      phoneNumber,
    }, {
      $set: {
        code,
        lastModified: Date.now(),
      }
    }, {upsert: true});
  }
}

module.exports = new SessionStore();
