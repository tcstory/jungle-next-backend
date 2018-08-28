const {NO_LOGIN} = require('../constants');
const {makeErrRes} = require('../libs/response');

module.exports = () => {
  return async function login(ctx, next) {
    if (!ctx.session.userId) {
      if (/^\/test/i.test(ctx.request.url)) {
        // test开头的路由不需要登录才能访问
        await next();
      } else if (/^\/sessions\/index/i.test(ctx.request.url)) {
        // 登录页也不需要权限
        await next();
      } else if (/^\/sessions\/code/i.test(ctx.request.url)) {
        // 获取短信验证的接口
        await next();
      } else if (/^\/sessions$/i.test(ctx.request.url) && /post/i.test(ctx.request.method)) {
        // 登录接口也不需要登录才能访问
        await next();
      } else if ([
        '/',
        '/passport/index',
        '/passport/users/index',
        '/passport/roles/index',
        '/passport/gates/index',
        '/passport/managers/index',
        '/home/index'
      ].indexOf(ctx.request.url) !== -1) {
        // 只有访问到属于权限服务自己的页面的时候,才会在没有登录的时候跳转到登录页
        ctx.redirect('/sessions/index');
      } else {
        // 由于到了这就就直接返回了,所以不再通过responseFilter中间件,
        // 那么响应就要自己格式化了
        makeErrRes(ctx, {msg: '未登录'}, {method: 'sessions', code: NO_LOGIN});
      }
    } else {
      await next();
    }
  };
};
