// server.js
const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Подключение к базе данных
connectDB();

app.use(express.json({ extended: false }));

// Определение маршрутов
app.use('/api/auth', require('./routes/auth-routes'));
app.use('/api/words', require('./routes/word-routes'));

// Корневой маршрут
app.get('/', (req, res) => {
    res.send('API is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
