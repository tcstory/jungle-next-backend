'use strict';

const MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');

const config = require('../config');
const logger = require('../libs/logger');

const NAME = process.env.NODE_ENV === 'test' ? 'test_jungle_auth_v2' : 'jungle_auth_v2';

let db = null;

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
    return MongoClient.connect(config.mongodb.url, {poolSize: 10}).then(function (client) {
        logger.info('connect to mongodb successfully.');

        db = wrap(client.db(NAME));

        return db;
    }).catch(function (err) {
        logger.error(err)
    });
}


module.exports = function getDb() {
    if (!db) {
        return main();
    }

    return Promise.resolve(db);
};

