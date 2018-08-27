const Joi = require('joi');

const create = require('./base');

module.exports = create({
    method: 'test',

    async getSomething() {
        let value = this.validate({
            name: Joi.string(),
        });

        if (value) {
            this.makeRes(`get something, name is ${value.name}`);
        }
    }
});
