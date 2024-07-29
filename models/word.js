// models/Word.js
const mongoose = require('mongoose');

const WordSchema = new mongoose.Schema({
    word: { type: String, required: true, unique: true },
    translation: { type: String, required: true },
    timesCorrect: { type: Number, default: 0 }, // Количество правильных ответов
});

module.exports = mongoose.model('Word', WordSchema);
