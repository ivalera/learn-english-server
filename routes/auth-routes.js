const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const authMiddleware = require('../middlewares/auth-middleware'); // Импортируйте ваш middleware

// Вспомогательная функция для отправки почты
const sendTokenByEmail = async (email, token) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    let mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Your new authentication token',
        text: `Here is your new token: ${token}`,
    };

    await transporter.sendMail(mailOptions);
};

// Маршрут для регистрации пользователя
router.post('/register', 
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists(),
        check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ msg: 'User already exists' });
            }

            user = new User({ email, password });

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            await user.save();

            const payload = { user: { id: user.id } };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

            res.status(201).json({ token });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// Маршрут для логина пользователя
router.post('/login', 
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            let user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ msg: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid credentials' });
            }

            const payload = { user: { id: user.id } };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

            res.json({ token });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// Маршрут для обновления токена
router.post('/renew-token', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

        // Отправка токена на почту
        await sendTokenByEmail(user.email, token);

        res.json({ msg: 'A new token has been sent to your email' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Маршрут для удаления пользователя
router.delete('/delete-user', authMiddleware, async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ msg: 'Email is required' });
        }

        // Найдите и удалите пользователя по email
        const user = await User.findOneAndDelete({ email });

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.status(200).json({ msg: 'User successfully deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
