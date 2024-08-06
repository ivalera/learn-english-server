const mongoose = require('mongoose');
const Word = require('./models/word'); // Убедитесь, что путь к модели правильный
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const connectDB = async () => {
    try {
        // Проверьте значение MONGO_URI
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in the .env file');
        }

        // Подключение к MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected');

        // Очистка коллекции
        await Word.deleteMany({}); // Удаление всех документов в коллекции

        // Чтение и обработка файла с данными слов
        const filePath = path.join(__dirname, './data/words.json');
        const fileData = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileData);

        // Преобразование данных в плоский массив слов с категорией
        const words = [];
        for (const [category, wordList] of Object.entries(data.groups_words)) {
            wordList.forEach(wordObj => {
                words.push({ ...wordObj, category }); // Добавляем поле category
            });
        }

        // Логируем данные для проверки
        console.log('Loaded words:', words);

        // Проверьте, что все объекты в массиве содержат необходимые поля
        words.forEach(word => {
            if (!word.word || !word.translation || !word.category) {
                throw new Error('Invalid word object: ' + JSON.stringify(word));
            }
        });

        // Вставка данных в коллекцию
        await Word.insertMany(words);
        console.log('Words inserted');

        // Отключение от MongoDB
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

connectDB();
