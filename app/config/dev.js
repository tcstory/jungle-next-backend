const {Level} = require('./constants');

module.exports = {
    logger: {
        level: Level.trace,
    },
    mongodb: {
        url: 'mongodb://localhost:27017',
        db: 'jungle_auth_v2',
    },
};
