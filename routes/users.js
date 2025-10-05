const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { check, validationResult } = require('express-validator');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token, authorization denied' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid' 
    });
  }
};

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        isPlayingForFree: user.isPlayingForFree,
        freeGamesPlayed: user.freeGamesPlayed,
        joinedAt: user.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching user profile' 
    });
  }
});

// Update user profile
router.put('/profile', [
  auth,
  check('username', 'Username must be between 3 and 30 characters')
    .optional()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
    
  check('email', 'Please include a valid email')
    .optional()
    .isEmail()
    .normalizeEmail(),
    
  check('currentPassword', 'Current password is required when changing password')
    .if((value, { req }) => req.body.newPassword)
    .notEmpty(),
    
  check('newPassword', 'New password must be at least 6 characters long')
    .optional()
    .isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { username, email, currentPassword, newPassword } = req.body;
    const user = req.user;
    
    // Update username if provided
    if (username && username !== user.username) {
      // Check if username is already taken
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }
      user.username = username;
    }
    
    // Update email if provided
    if (email && email !== user.email) {
      // Check if email is already taken
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already registered'
        });
      }
      user.email = email;
    }
    
    // Update password if provided
    if (newPassword) {
      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      // Update to new password
      user.password = newPassword;
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        isPlayingForFree: user.isPlayingForFree
      }
    });
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating user profile' 
    });
  }
});

// Add funds to user account (for demo purposes, in a real app this would connect to a payment processor)
router.post('/add-funds', [
  auth,
  check('amount', 'Amount must be a positive number')
    .isFloat({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { amount } = req.body;
    const user = req.user;
    
    // Add funds to user's balance
    user.balance += parseFloat(amount);
    
    // Check if user was in free play mode and now has enough balance
    if (user.isPlayingForFree && user.balance > 0) {
      user.isPlayingForFree = false;
      user.freeGamesPlayed = 0;
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: `Successfully added $${amount} to your account`,
      newBalance: user.balance,
      isPlayingForFree: user.isPlayingForFree
    });
    
  } catch (error) {
    console.error('Error adding funds:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error adding funds' 
    });
  }
});

// Request password reset
router.post('/request-password-reset', [
  check('email', 'Please include a valid email')
    .isEmail()
    .normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { email } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal that the email doesn't exist
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }
    
    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
    
    // In a real app, you would send an email with a link containing the reset token
    // For this example, we'll just return the token
    
    res.json({
      success: true,
      message: 'Password reset link has been sent to your email',
      // In production, don't return the token in the response
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
    
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error requesting password reset' 
    });
  }
});

// Reset password with token
router.post('/reset-password', [
  check('token', 'Token is required').notEmpty(),
  check('newPassword', 'New password must be at least 6 characters long')
    .isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { token, newPassword } = req.body;
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
    
  } catch (error) {
    console.error('Error resetting password:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error resetting password' 
    });
  }
});

// Delete user account
router.delete('/account', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // In a real app, you might want to anonymize user data instead of deleting it
    await User.findByIdAndDelete(user._id);
    
    res.json({
      success: true,
      message: 'Your account has been deleted'
    });
    
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error deleting account' 
    });
  }
});

module.exports = router;
