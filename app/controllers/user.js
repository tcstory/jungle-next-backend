const Joi = require('joi');

const create = require('./base');

const User = require('../models/User');

module.exports = create({
    method: 'user',

    async postSomething() {
        let value = this.validate({
            name: Joi.string(),
        });

        if (value) {
            await User.create({
                name: '吃饭',
                email: 'yanguibin@qmtv.com',
                phoneNumber: 110,
            });

            this.makeRes('ok');
        }
    }
});
