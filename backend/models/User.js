const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    img: {
        type: String,
        default: 'https://via.placeholder.com/150'
    },
    cover: {
        type: String,
        default: 'https://via.placeholder.com/600x200'
    },
    age: Number,
    height: Number,
    weight: Number,
    country: String,
    lookingFor: [String],
    gallery: [String],
    isOnline: {
        type: Boolean,
        default: false
    },
    lat: {
        type: Number,
        default: 13.7563 // Default to Bangkok
    },
    lng: {
        type: Number,
        default: 100.5018
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
