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

  describe('[userStore.getUsers]', function () {
    before(async function () {
      // 把用户的数量补充到15个,方便进行下面的测试

      let users = [];

      for (let i of [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) {
        users.push({
          name: `test${i}`,
          email: `test${i}@test.com`,
          phoneNumber: Number(`1000000000${i}`),
        });
      }

      await userStore.addUsers({users,});
    });

    it('获取第一页的用户(默认只返回10条记录)', function () {
      return userStore.getUsers().then(function (ret) {
        assert.ok(ret.results.length === 10 && ret.total === 15);
      }).catch(function (err) {
        assert.ok(false, err);
      });
    });

    it('获取第二页的用户(默认只返回10条记录)', function () {
      return userStore.getUsers({
        page: 2,
      }).then(function (ret) {
        assert.ok(ret.results.length === 5 && ret.total === 15);
      }).catch(function (err) {
        assert.ok(false, err);
      });
    });

    it('通过设置pageSize获取前15个用户(默认只返回10条记录)', function () {
      return userStore.getUsers({
        pageSize: -1,
      }).then(function (ret) {
        // 数据库返回的数据是逆序的,这里我们处理一下,让他变成从test1排列到test15
        testUsers = ret.results.sort(function (a, b) {
          return a.phoneNumber - b.phoneNumber;
        });

        assert.ok(ret.results.length === 15 && ret.total === 15);
      }).catch(function (err) {
        assert.ok(false, err);
      });
    });

    it('通过设置userIds查询参数获取用户', function () {
      return userStore.getUsers({
        userIds: [
          testUsers[0].userId,
          testUsers[5].userId,
        ],
        pageSize: 2,
      }).then(function (ret) {
        let flag = false;
        let {results, total} = ret;

        if (total === 2) {
          let map = {};

          for (let item of results) {
            map[item.userId] = item;
          }

          if (map[testUsers[0].userId] && map[testUsers[5].userId]) {
            flag = true;
          }
        }

        assert.ok(flag);
      }).catch(function (err) {
        assert.ok(false, err);
      });
    });

    it('通过设置names查询参数获取用户', function () {
      return userStore.getUsers({
        names: [
          testUsers[0].name,
          testUsers[5].name,
          testUsers[7].name,
        ],
        pageSize: 3,
      }).then(function (ret) {
        let flag = false;
        let {results, total} = ret;

        if (total === 3) {
          let map = {};

          for (let item of results) {
            map[item.name] = item;
          }

          if (map[testUsers[0].name]
            && map[testUsers[5].name]
            && map[testUsers[7].name]
          ) {
            flag = true;
          }
        }

        assert.ok(flag);
      }).catch(function (err) {
        assert.ok(false, err);
      });
    });

    it('通过设置emails查询参数获取用户', function () {
      return userStore.getUsers({
        emails: [
          testUsers[0].email,
          testUsers[5].email,
        ],
        pageSize: 2,
      }).then(function (ret) {
        let flag = false;
        let {results, total} = ret;

        if (total === 2) {
          let map = {};

          for (let item of results) {
            map[item.email] = item;
          }

          if (map[testUsers[0].email]
            && map[testUsers[5].email]
          ) {
            flag = true;
          }
        }

        assert.ok(flag);
      }).catch(function (err) {
        assert.ok(false, err);
      });
    });

    it('通过设置phoneNumbers查询参数获取用户', function () {
      return userStore.getUsers({
        phoneNumbers: [
          testUsers[0].phoneNumber,
          10000000000, // 这个是不存在的号码
        ],
      }).then(function (ret) {
        let flag = false;
        let {results, total} = ret;

        if (total === 1) {
          let map = {};

          for (let item of results) {
            map[item.phoneNumber] = item;
          }

          if (map[testUsers[0].phoneNumber]) {
            flag = true;
          }
        }

        assert.ok(flag);
      }).catch(function (err) {
        assert.ok(false, err);
      });
    });

    it('通过设置nameLike为^test1来查询参数获取用户', function () {
      return userStore.getUsers({
        nameLike: '^test1',
      }).then(function (ret) {
        assert.ok(ret.total === 7);
      }).catch(function (err) {
        assert.ok(false, err);
      });
    });

    it('通过设置nameLike为^test1.+来查询参数获取用户', function () {
      return userStore.getUsers({
        nameLike: '^test1.+',
      }).then(function (ret) {
        assert.ok(ret.total === 6);
      }).catch(function (err) {
        assert.ok(false, err);
      });
    });

  });

  describe('[userStore.updateUsers]', function () {
    it('users为空的时候,会报错的', function () {
      return userStore.updateUsers({
        users: []
      }).then(function () {
        assert.ok(false);
      }).catch(function () {
        assert.ok(true);
      })
    });

    it('更新test1和test2用户的信息', function () {
      let id0 = testUsers[0].userId;
      let id1 = testUsers[1].userId;
      let phoneNumber = testUsers[0].phoneNumber * 100;

      return userStore.updateUsers({
        users: [
          {userId: id0, data: {name: 'test11', phoneNumber,}},
          {userId: id1, data: {name: 'test22'}}
        ]
      }).then(function (ret) {
        if (ret.result.n !== 2) {
          return Promise.reject(ret.result)
        }
      }).then(function () {
        return userStore.getUsers({
          userIds: [id0, id1]
        });
      }).then(function ({results}) {
        let flag = false;

        let map = {};
        for (let item of results) {
          let id = item.userId;
          map[id] = item;
        }

        if (map[id0].name === 'test11' && map[id0].phoneNumber === phoneNumber) {
          if (map[id1].name === 'test22') {
            if (map[id1].updatedAt > map[id1].createdAt) {
              flag = true;
            }
          }
        }

        assert.ok(flag);
      }).catch(function (err) {
        assert.ok(false, err);
      })
    });

    it('data为空对象的时候,不会进行更新操作', function () {
      return userStore.updateUsers({
        users: [
          {
            userId: testUsers[2].userId,
            data: {},
          }
        ]
      }).then(function (ret) {
        assert.ok(ret.result.n === 0);
      }).catch(function (err) {
        assert.ok(false, err);
      })
    });
  });

  describe('[userStore.delUsers]', function () {
    it('删掉test14和test15用户', function () {
      return userStore.delUsers({
        userIds: [testUsers[13].userId, testUsers[14].userId],
      }).then(function (ret) {
        if (ret.result.n !== 2) {
          assert(false);
        } else {
          return userStore.getUsers({
            userIds: [testUsers[13].userId, testUsers[14].userId]
          })
        }
      }).then(function ({total}) {
        assert(total === 0);
      }).catch(function (err) {
        assert.ok(false, err);
      })
    });
  });

  after(function () {
    return client.close();
  });
});
