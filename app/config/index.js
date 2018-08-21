let config = {};

if (['development', 'test'].indexOf(process.env.NODE_ENV) >= 0) {
    config = require('./dev');
    config.isDebug = true;
} else {
    config = require('./prod');
    config.isDebug = false;
}

module.exports = config;
