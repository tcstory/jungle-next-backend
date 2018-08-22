const uniqid = require('uniqid');
const Joi = require('joi');

const {PAGE_SIZE} = require('../constants');
const {getQuery, validate, findPage} = require('./base');
const getDb = require('./db');

const NAME = 'users';

class UserStore {
    constructor() {
        getDb().then((db) => {
            this.db = db;
            this.findPage = findPage(this.db.collection(NAME));
        });

        this.getQuery = getQuery;
        this.validate = validate;
    }

    getUsers(params) {
        let value = this.validate(params, {
            names: Joi.array().items(Joi.string().trim()).empty('').default([]),
            emails: Joi.array().items(Joi.string().trim().email()).empty('').default([]),
            phoneNumbers: Joi.array().items(Joi.number()).empty('').default([]),

            page: Joi.number().default(1),
            pageSize: Joi.number().default(PAGE_SIZE),
        });

        let queryObj = this.getQuery();

        queryObj.page = value.page;
        queryObj.pageSize = value.pageSize;

        if (value.names.length) {
            queryObj.name = {
                $in: value.names,
            };
        }

        if (value.emails.length) {
            queryObj.email = {
                $in: value.emails,
            };
        }

        if (value.phoneNumbers.length) {
            queryObj.phoneNumber = {
                $in: value.phoneNumbers
            };
        }

        return this.findPage(queryObj, {_id: 0, softDelete: 0});
    }

    addUsers(params) {
        let value = this.validate(params, {
            users: Joi.array().items({
                name: Joi.string().trim().required(),
                email: Joi.string().trim().email().required(),
                phoneNumber: Joi.number().required(),
            }).min(1).required(),
        });

        let now = Date.now();

        let list = [];

        for (let item of value.users) {
            list.push({
                ...item,
                userId: uniqid(),
                updatedAt: now,
                createdAt: now,
                softDelete: 0,
            });
        }

        return this.db.collection(NAME).insertMany(list);
    }

    async updateUsers(params) {
        let value = this.validate(params, {
            users: Joi.array().items({
                userId: Joi.string().trim().required(),
                data: {
                    name: Joi.string().trim().empty(''),
                    phoneNumber: Joi.number().empty(''),
                },
            }).min(1).required(),
        });

        let works = [];

        for (let user of value.users) {
            let queryObj = this.getQuery();
            queryObj.userId = user.userId;

            let data = {
                $set: {
                    updatedAt: Date.now(),
                },
            };

            if (user.data.name) {
                data.$set.name = user.data.name;
            }

            if (user.data.phoneNumber) {
                data.$set.phoneNumber = user.data.phoneNumber;
            }

            works.push(
                this.db.collection(NAME).updateOne(queryObj, data)
            );
        }

        return Promise.all(works).then(function (ret) {
            let n = 0;
            ret.forEach(function (item) {
                n += item.result.n;
            });

            return {
                result: {n,}
            }
        });
    }


    async delUsers(params) {
        let value = this.validate(params, {
            userIds: Joi.array().items(Joi.string().trim()).min(1).required(),
        });

        let queryObj = this.getQuery();

        queryObj.userId = {
            $in: value.userIds,
        };

        return this.db.collection(NAME).updateMany(queryObj, {
            $set: {
                softDelete: Date.now(),
            }
        });
    }

}

module.exports = new UserStore();
