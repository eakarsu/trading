const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');

const generateToken = userId => jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '12h' });
const cleanText = (value, min, max) => typeof value === 'string' && value.trim().length >= min && value.trim().length <= max
  ? value.trim() : null;
const publicUser = user => ({
  id: user.id, username: user.username, email: user.email, firstName: user.firstName,
  lastName: user.lastName, role: user.role, preferences: user.preferences, createdAt: user.createdAt,
});

const registerUser = async (req, res) => {
  try {
    const username = cleanText(req.body.username, 3, 30);
    const email = cleanText(req.body.email, 3, 254)?.toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const firstName = cleanText(req.body.firstName, 1, 50);
    const lastName = cleanText(req.body.lastName, 1, 50);
    if (!username || !email || !/^\S+@\S+\.\S+$/.test(email) || password.length < 12 || password.length > 100 || !firstName || !lastName) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Valid names, email, username, and a password of 12–100 characters are required' });
    }
    const existing = await User.findOne({ where: { [Op.or]: [{ email }, { username }] } });
    if (existing) return res.status(409).json({ code: 'USER_EXISTS', message: 'Email or username is already registered' });
    const user = await User.create({ username, email, password, firstName, lastName });
    return res.status(201).json({ ...publicUser(user), token: generateToken(user.id) });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Invalid registration data' });
    console.error('[registration-error]', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Registration failed' });
  }
};

const authUser = async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = email ? await User.findOne({ where: { email } }) : null;
    if (!user || !user.isActive || !(await user.comparePassword(password))) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }
    user.lastLogin = new Date();
    await user.save();
    return res.json({ ...publicUser(user), token: generateToken(user.id) });
  } catch (error) {
    console.error('[authentication-error]', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Authentication failed' });
  }
};

const getUserProfile = async (req, res) => res.json(publicUser(req.user));

const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ code: 'USER_NOT_FOUND', message: 'User not found' });
    for (const [field, min, max] of [['firstName', 1, 50], ['lastName', 1, 50], ['username', 3, 30]]) {
      if (req.body[field] !== undefined) {
        const normalized = cleanText(req.body[field], min, max);
        if (!normalized) return res.status(400).json({ code: 'VALIDATION_ERROR', message: `${field} is invalid` });
        user[field] = normalized;
      }
    }
    if (req.body.email !== undefined) {
      const email = cleanText(req.body.email, 3, 254)?.toLowerCase();
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'email is invalid' });
      const duplicate = await User.findOne({ where: { email, id: { [Op.ne]: user.id } } });
      if (duplicate) return res.status(409).json({ code: 'EMAIL_IN_USE', message: 'Email already in use' });
      user.email = email;
    }
    if (req.body.preferences && typeof req.body.preferences === 'object' && !Array.isArray(req.body.preferences)) {
      user.preferences = { ...user.preferences, ...req.body.preferences };
    }
    await user.save();
    return res.json({ ...publicUser(user), token: generateToken(user.id) });
  } catch (error) {
    console.error('[profile-update-error]', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Profile update failed' });
  }
};

module.exports = { registerUser, authUser, getUserProfile, updateUserProfile };
