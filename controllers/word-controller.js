// controllers/word-controller.js
const Word = require('../models/word');

// Получение всех слов
const getWords = async (req, res) => {
    try {
        const words = await Word.find({});
        res.json(words);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

// Добавление нового слова
const addWord = async (req, res) => {
    const { word, translation } = req.body;

    try {
        let newWord = new Word({
            word,
            translation,
            correctAnswers: 0, // Начальное значение количества правильных ответов
        });

        newWord = await newWord.save();
        res.json(newWord);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

module.exports = { getWords, addWord };
