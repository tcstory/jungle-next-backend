const {SUCCESS, NORMAL_ERROR, APP_NAME} = require('../constants');

function makeRes(ctx, body = {}, method = 'undefined') {
  let obj = {
    msg: '',
  };

  if (typeof body === 'string') {
    obj.msg = body;
  } else {
    obj = body;
  }

  ctx.body = {
    code: SUCCESS,
    app: APP_NAME,
    method,
    data: obj,
  }
}

function makeErrRes(ctx, error, method = 'undefined') {
  let obj = {
    msg: '',
  };

  if (typeof error === 'string') {
    obj.msg = error;
  } else if (typeof error.toString === 'function') {
    let tmp = error.toString();
    if (tmp !== '[object Object]') {
      obj.msg = tmp;
    } else {
      obj = error;
    }
  } else {
    obj = error;
  }

  ctx.body = {
    error: obj,
    code: NORMAL_ERROR,
    app: APP_NAME,
    method,
  }
}

module.exports = {
  makeRes,
  makeErrRes,
};
