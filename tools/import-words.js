const mongoose = require('mongoose');
const Word = require('../models/word');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const connectDB = async () => {
    try {
        // Подключение к MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');

        // Очистка коллекции
        await Word.deleteMany({}); // Удаление всех документов в коллекции

        // Чтение файла с данными слов
        const filePath = path.join(__dirname, '../data/words.json');
        const words = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Вставка данных в коллекцию
        await Word.insertMany(words);
        console.log('Words inserted');

        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

connectDB();
