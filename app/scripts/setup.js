/**
 * # AUTH
 * ## 简介
 * ### 每一次从头初始化一个项目的时候,需要跑一下这个脚本
 *
 * ## 如何使用
 * 1. 测试环境的时候,执行: `NODE_ENV=development node setup.js`
 * 2. 线上的时候,执行: `NODE_ENV=production node setup.js`
 */

const logger = require('../libs/logger');
const getDb = require('../models/db');


async function main() {
    logger.info('检查索引');

    let db = await getDb();

    await db.collection('users').ensureIndex({email: 1, softDelete: 1}, {unique: true});
    await db.collection('users').ensureIndex({phoneNumber: 1, softDelete: 1}, {unique: true});

}

main().then(function () {
    logger.info(88);
    process.exit(0);
}).catch(function (err) {
    logger.error(err);
    process.exit(1);
});
