// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register } = require('../controllers/auth-controller');

router.post('/register', register);

// Добавьте другие маршруты для входа, получения информации о пользователе и т.д.

module.exports = router;
