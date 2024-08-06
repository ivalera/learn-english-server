// middlewares/auth-middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');
require('dotenv').config();

const authMiddleware = async (req, res, next) => {
    const token = req.header('x-auth-token');
    console.log('Token received:', token);
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded); // Логирование декодированного токена
        
        const user = await User.findById(decoded.user.id);
        if (!user) {
            return res.status(401).json({ msg: 'User not found' });
        }

        req.user = decoded.user;
        next();
    } catch (err) {
        console.error('Token verification error:', err);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
