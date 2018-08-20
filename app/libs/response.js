const {SUCCESS, NORMAL_ERROR, APP_NAME} = require('../constants');

function makeRes(ctx, body, method = 'undefined') {
    ctx.body = {
        code: SUCCESS,
        app: APP_NAME,
        method,
        data: body,
    }
}

function makeErrRes(ctx, error, method = 'undefined') {
    let msg = '';

    if (typeof error.toString === 'function') {
        msg = error.toString();
    } else {
        msg = error;
    }

    ctx.body = {
        error: {
            msg,
        },
        code: NORMAL_ERROR,
        app: APP_NAME,
        method,
    }
}

module.exports = {
    makeRes,
    makeErrRes,
};
