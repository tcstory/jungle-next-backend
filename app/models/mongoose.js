const mongoose = require('mongoose');
require('mongoose-type-email');

const logger = require('../libs/logger');

const config = require('../config');

mongoose.connect(`${config.mongodb.url}/${config.mongodb.db}`);

const db = mongoose.connection;

db.on('error', function (err) {
    logger.error(err);
});

db.once('open', function () {
    logger.info('connect mongodb successfully.');
});


module.exports = mongoose;

