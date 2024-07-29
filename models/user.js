// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    wordsStudied: { type: [String], default: [] }, // Список изученных слов
    achievements: { type: Map, of: Number, default: {} }, // Достижения
});

module.exports = mongoose.model('User', UserSchema);
