let config = {
  keys: ['jungle_next'],
  session: {
    key: 'jungle-next',
    maxAge: 3 * 24 * 3600 * 1000, // 3 天
    domain: '127.0.0.1',
  }
};

if (['development', 'test'].indexOf(process.env.NODE_ENV) >= 0) {
  config = Object.assign(config, require('./dev'), {
    isDebug: true,
  });
} else {
  config = Object.assign(config, require('./prod'), {
    isDebug: false,
  });
}

module.exports = config;
