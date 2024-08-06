const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const authMiddleware = require('../middlewares/auth-middleware'); // Импортируйте ваш middleware
const PasswordResetToken = require('../models/password-reset-token');
const crypto = require('crypto');

// Вспомогательная функция для отправки почты
const sendInfoToEmail = async (email) => {
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
        subject: 'Пароль обновлён.',
        text: `Пароль обновлён, войдите в аккаунт.`,
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
                return res.status(400).json({ msg: 'Эта почта, уже зарегестрированна! Попробуйте другую.' });
            }

            user = new User({ email, password });

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            await user.save();

            // Отправка сообщения с деталями
            res.status(201).json({
                msg: 'Вы успешно зарегистрированы! Перейдите обратно на сайт для входа!',
                email: `Ваша почта ${user.email}`,
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// Маршрут для логина пользователя
router.post('/login', 
    [
        check('email', 'Пожалуйста, укажите действительный адрес электронной почты.').isEmail(),
        check('password', 'Необходим пароль.').exists()
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
                return res.status(400).json({ msg: 'Недействительные учетные данные, почта.' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Недействительные учетные данные, пароль.' });
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
            return res.status(404).json({ msg: 'Пользователь не найден.' });
        }

        // Генерация нового токена
        const payload = { user: { id: user.id } };
        const newToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.json({ token: newToken });
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
            return res.status(400).json({ msg: 'Требуется адрес электронной почты.' });
        }

        // Найдите и удалите пользователя по email
        const user = await User.findOneAndDelete({ email });

        if (!user) {
            return res.status(404).json({ msg: 'Пользователь не найден.' });
        }

        res.status(200).json({ msg: 'Пользователь успешно удален.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Маршрут для запроса сброса пароля
router.post('/forgot-password', 
    [
        check('email', 'Пожалуйста, укажите действительный адрес электронной почты.').isEmail()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email } = req.body;

        try {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ msg: 'Пользователь не найден.' });
            }

            // Создание токена сброса пароля
            const token = crypto.randomBytes(20).toString('hex');
            const expires = Date.now() + 3600000; // 1 час

            await PasswordResetToken.findOneAndUpdate(
                { userId: user._id },
                { token, expires },
                { upsert: true }
            );
            
            // https://learn-english-server-eta.vercel.app
            // Отправка email с токеном сброса
            const resetUrl = `http://localhost:5000/api/auth/reset-password/${token}`;
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL,
                to: email,
                subject: 'Запрос на сброс пароля.',
                text: `Чтобы сбросить пароль, нажмите на следующую ссылку или скопируйте и вставьте ее в адресную строку браузера: \n\n ${resetUrl}`,
            };

            await transporter.sendMail(mailOptions);

            res.json({ msg: 'Ссылка для сброса пароля отправлена ​​на ваш адрес электронной почты.' });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// Маршрут для сброса пароля
router.post('/reset-password/:token', 
    [
        check('password', 'Необходим пароль').exists(),
        check('password', 'Пароль должен содержать не менее 6 символов').isLength({ min: 6 })
    ],
    async (req, res) => {
        const { token } = req.params;
        const { password } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            // Проверка токена сброса
            const resetToken = await PasswordResetToken.findOne({ token });
            if (!resetToken || resetToken.expires < Date.now()) {
                return res.status(400).json({ msg: 'Токен недействителен или просрочен.' });
            }

            // Найти пользователя по ID из токена сброса
            const user = await User.findById(resetToken.userId);
            if (!user) {
                return res.status(404).json({ msg: 'Пользователь не найден.' });
            }

            // Обновление пароля
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();

            // Удаление токена сброса
            await PasswordResetToken.deleteOne({ token });

            await sendInfoToEmail(user.email);

            res.json({ msg: 'Пароль успешно сброшен.'});
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);


module.exports = router;
