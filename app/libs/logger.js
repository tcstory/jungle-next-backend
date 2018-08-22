const _logger = require('pino');

const config = require('../config');

const logger = _logger({
    prettyPrint: config.isDebug,
});

logger.level = config.logger.level;

module.exports = logger;
