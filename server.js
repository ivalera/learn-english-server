const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Подключение CORS
app.use(cors({
    origin: 'http://localhost:5173',
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization,x-auth-token',
}));

app.use(express.json());

// Маршруты
app.use('/api/auth', require('./routes/auth-routes'));
app.use('/api/words', require('./routes/word-routes'));

// Базовый маршрут для проверки
app.get('/', (req, res) => {
    res.send('Server is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
