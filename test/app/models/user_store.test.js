'use strict';

const assert = require('assert');

const getClient = require('../../../app/models/db');
const userStore = require('../../../app/models/user_store');

describe('[userStore]', function () {

  let db;
  let client;

  let testUsers = [];

  before(async function () {
    let ret = await getClient();
    db = ret.db;
    client = ret.client;

    await db.collection('users')._rawDeleteMany({});

    await db.collection('users').ensureIndex({email: 1, softDelete: 1}, {unique: true});
    await db.collection('users').ensureIndex({phoneNumber: 1, softDelete: 1}, {unique: true});
  });


  describe('[userStore.addUsers]', function () {
    it('users为空数组时,应该报错', function () {
      return userStore.addUsers({users: []}).then(function () {
        assert.ok(false);
      }).catch(function () {
        assert.ok(true);
      });
    });

    it('users的元素缺少对应的属性,应该报错', function () {
      return userStore.addUsers({users: [{}]}).then(function () {
        assert.ok(false);
      }).catch(function () {
        assert.ok(true);
      });
    });

    it('成功添加test1和test2两个用户', function () {
      return userStore.addUsers({
        users: [
          {
            name: 'test1',
            email: 'test1@test.com',
            phoneNumber: 10000000001,
          },
          {
            name: 'test2',
            email: 'test2@test.com',
            phoneNumber: 10000000002,
          }
        ]
      }).then(function (ret) {

        testUsers = testUsers.concat(ret.ops);

        assert.ok(ret.result.ok === 1 && ret.result.n === 2);
      }).catch(function (err) {
        assert.ok(false, err);
      });
    });

    it('用户的邮箱重复会报错', function () {
      return userStore.addUsers({
        users: [
          {
            name: 'test3',
            email: 'test1@test.com',
            phoneNumber: 10000000000,
          }
        ]
      }).then(function () {
        assert.ok(false);
      }).catch(function (err) {
        assert.ok(err.code === 11000);
      });
    });

    it('用户的手机号码重复会报错', function () {
      return userStore.addUsers({
        users: [
          {
            name: 'test3',
            email: 'test3@test.com',
            phoneNumber: 10000000001,
          }
        ]
      }).then(function () {
        assert.ok(false);
      }).catch(function (err) {
        assert.ok(err.code === 11000);
      });
    });

  });

  after(function () {
    return client.close();
  });
});
