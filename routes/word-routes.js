// routes/wordRoutes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth-middleware');
const { getWords, addWord } = require('../controllers/word-controller');

// Применяем middleware для проверки токена
router.get('/', authenticate, getWords);
router.post('/', authenticate, addWord);

module.exports = router;
