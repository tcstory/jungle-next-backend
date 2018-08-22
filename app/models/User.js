const uniqid = require('uniqid');

const mongoose = require('./mongoose');

const Schema = mongoose.Schema;

let schema = new Schema({
    userId: String,
    name: {
        type: String,
        trim: true,
    },
    email: {
        type: mongoose.SchemaTypes.Email,
        required: true,
        unique: true,
    },
    phoneNumber: Number,
});

schema.pre('save', function (next) {
    this.userId = uniqid();
    next();
});

const User = mongoose.model('User', schema);

module.exports = User;
