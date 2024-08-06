// controllers/word-controller.js
const Word = require('../models/word');
const User = require('../models/user');

// Получение всех слов
const getWords = async (req, res) => {
    try {
        // Найти пользователя по ID из токена
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        console.log('Fetching words...');
        const words = await Word.find({});
        console.log('Words fetched:', words);
        res.json(words);
    } catch (err) {
        console.error('Error fetching words:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Добавление нового слова
const addWord = async (req, res) => {
    const { word, translation } = req.body;

    try {
        // Найти пользователя по ID из токена
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        console.log('Adding new word:', word);
        let newWord = new Word({
            word,
            translation,
            correctAnswers: 0, // Начальное значение количества правильных ответов
        });

        newWord = await newWord.save();
        console.log('New word added:', newWord);
        res.json(newWord);
    } catch (err) {
        console.error('Error adding new word:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

module.exports = { getWords, addWord };
