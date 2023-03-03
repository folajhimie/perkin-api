const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        maxlength: 20,
        minlength: [3, 'Minimum firstname length is 6 characters'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is Invalid')
            }
        },
        lowercase: [true, 'Please ensure your email should be in lowercase'],
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password should not contain word: password')
            }
        },
        minlength: [4, 'Minimum password length is 4 characters'],
        select: true,
        trim: true
    },
    confirmPassword: {
        type: String,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password should not contain word: password')
            }
        },
        trim: true,
        minlength: [4, 'Minimum password length is 4 characters'],
        required: true,
    },
    mobile: {
        type: String,
        unique: true,
        trim: true,
        validate(value) {
            if (!validator.isMobilePhone(value)) {
                throw new Error('Phone is invalid');
            }
        },
        required: [true, 'What is your contact number?']
    },
    code: {
        type: String,
        default: true
    },
    verified: {
        type: Boolean,
    },
    roles: {
        type: [String],
        default: ["Employee"]
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
},
    {
        timestamps: true,
    }
)


// jwt token
userSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN_SECRET, 
        { expiresIn: "1d" }
    );
};

const User = mongoose.model('User', userSchema);

module.exports = User;