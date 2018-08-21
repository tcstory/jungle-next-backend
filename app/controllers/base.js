const Joi = require('joi');
const {makeRes, makeErrRes} = require('../libs/response');

const Base = {

    /**
     * 如果验证通过,返回验证结果,否则返回null
     * @param ctx Object koa的上下文对象
     * @param schema Object Joi需要的schema
     * @return {Object || null}
     */
    validate(ctx, schema) {
        let data;
        let method = ctx.method.toLowerCase();

        if (['get', 'delete'].indexOf(method) !== -1) {
            data = ctx.request.query;
        } else if (['post', 'put'].indexOf(method) !== -1) {
            data = ctx.request.body;
        } else {
            throw new Error('unsupported http verb.');
        }

        const result = Joi.validate(data, schema);

        if (result.error) {
            makeErrRes(ctx, result.error);
            return null;
        } else {
            return result.value;
        }
    }
};

module.exports = function create(obj) {
    let ret = {};

    for (let method of Object.getOwnPropertyNames(obj)) {
        if (typeof obj[method] === 'function') {
            // 如果是方法的话,需要特殊处理一下,给他绑定上ctx对象.
            ret[method] = function (ctx) {
                let self = {
                    ctx,
                    validate(schema) {
                        return Base.validate(ctx, schema);
                    },
                    makeRes(body) {
                        return makeRes(ctx, body, ret.method);
                    },
                    makeErrRes(err) {
                        return makeErrRes(ctx, err, ret.method);
                    }
                };


                // try catch 只能捕获到同步的错误,所以为了能够处理返回promise的方法和async的方法,
                // 我需要多做一下处理
                try {
                    let p = obj[method].apply(self);

                    if (typeof p.then === 'function') {
                        return p.then(null, function (err) {
                            self.makeErrRes(err);
                        });
                    } else {
                        return p;
                    }
                } catch (e) {
                    ctx.log.error(e);
                    self.makeErrRes(e);
                }
            }
        } else {
            // 如果是普通的属性的话,就直接复制
            ret[method] = obj[method];
        }
    }

    return ret;
};
