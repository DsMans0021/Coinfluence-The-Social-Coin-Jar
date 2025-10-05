const { check, validationResult } = require('express-validator');

// Validation rules for user registration
exports.validateRegister = [
  check('username', 'Username is required')
    .notEmpty()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
    
  check('email', 'Please include a valid email')
    .isEmail()
    .normalizeEmail(),
    
  check('password', 'Password must be at least 6 characters long')
    .isLength({ min: 6 }),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation rules for user login
exports.validateLogin = [
  check('email', 'Please include a valid email')
    .isEmail()
    .normalizeEmail(),
    
  check('password', 'Password is required')
    .exists(),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

// Middleware to validate game results
exports.validateGameResult = [
  check('gameType', 'Game type is required')
    .isIn(['slots', 'blackjack', 'poker', 'roulette', 'free']),
    
  check('result', 'Result is required and must be win, loss, or draw')
    .isIn(['win', 'loss', 'draw']),
    
  check('amount', 'Amount is required and must be a number')
    .isNumeric(),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];
