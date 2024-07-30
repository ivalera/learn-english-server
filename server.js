const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Подключение к базе данных
connectDB();

// Настройка CORS
app.use(cors({
    origin: '*', // Разрешите доступ с вашего фронтенд-домена
    methods: 'GET,POST,PUT,DELETE', // Разрешите необходимые методы
    allowedHeaders: 'Content-Type,Authorization', // Разрешите необходимые заголовки
}));

app.use(express.json({ extended: false }));

// Определение маршрутов
app.use('/api/auth', require('./routes/auth-routes'));
app.use('/api/words', require('./routes/word-routes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
