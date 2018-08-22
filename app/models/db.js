'use strict';

const EventEmitter = require('events');

const MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');

const config = require('../config');
const logger = require('../libs/logger');

const NAME = process.env.NODE_ENV === 'test' ? 'test_jungle_auth_v2' : 'jungle_auth_v2';

class MyEmitter extends EventEmitter {
}

let myEmitter = new MyEmitter();

let store = null;
let isConnecting = false;

function wrap(db) {
  db._rawCollection = db.collection;

  db.collection = function (name) {
    let col = db._rawCollection(name);

    col._rawDeleteMany = col.deleteMany;
    col.deleteMany = function (...args) {
      let filter = args[0];

      if (_.isEmpty(filter)) {
        return Promise.reject(new Error('deleteMany method needs filter.'));
      } else {
        return col._rawDeleteMany(...args);
      }
    };

    col._rawUpdateMany = col.updateMany;
    col.updateMany = function (...args) {
      let filter = args[0];

      if (_.isEmpty(filter)) {
        return Promise.reject(new Error('updateMany method needs filter.'));
      } else {
        return col._rawUpdateMany(...args);
      }
    };

    return col;
  };

  return db;
}

function main() {
  isConnecting = true;

  return MongoClient.connect(config.mongodb.url, {poolSize: 10}).then(function (c) {
    logger.info('connect to mongodb successfully.');

    isConnecting = false;

    store = {
      client: c,
      db: wrap(c.db(NAME))
    };

    myEmitter.emit('connect', null);

    return store;
  }).catch(function (err) {
    logger.error(err);

    isConnecting = false;
    myEmitter.emit('connect', err);
  });
}


module.exports = function getClient() {
  if (!store) {
    if (isConnecting) {
      return new Promise(function (resolve, reject) {
        myEmitter.on('connect', (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(store);
          }
        });
      })
    } else {
      return main();
    }
  } else {
    return Promise.resolve(store);
  }
};

