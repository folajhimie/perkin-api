const mongoose = require('mongoose');


const UserVerificationSchema = new mongoose.Schema({
    userId: {
        type: String,
    },
    username: {
        type: String,
    },
    uniqueString: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiredAt: {
        type: Date,
        default: Date.now
    },
},
    {
        timestamps: true,
    }
)


const UserVerification = mongoose.model('UserVerification', UserVerificationSchema);

module.exports = UserVerification;