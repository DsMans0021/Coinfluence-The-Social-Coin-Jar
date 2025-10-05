const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const GameHistory = require('../models/GameHistory');
const { validateGameResult } = require('../middleware/validation');

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

// Record game result
router.post('/record', auth, validateGameResult, async (req, res) => {
  try {
    const { gameType, result, amount, details = {} } = req.body;
    const user = req.user;
    
    // Check if user is in free play mode
    if (user.isPlayingForFree) {
      if (!user.canPlayFreeGame()) {
        return res.status(400).json({
          success: false,
          message: 'Please wait before playing another free game',
          nextFreeGameIn: '1 hour'
        });
      }
      
      // In free play mode, user can't win real money
      if (amount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot win real money in free play mode'
        });
      }
    }
    
    // Check if user has enough balance (only for non-free games and not in free play mode)
    if (!user.isPlayingForFree && amount < 0 && user.balance < Math.abs(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
        requiredBalance: Math.abs(amount),
        currentBalance: user.balance
      });
    }
    
    // Create game history record
    const gameHistory = new GameHistory({
      userId: user._id,
      gameType,
      result,
      amount,
      details
    });
    
    await gameHistory.save();
    
    // Update user balance and game history
    user.addGameResult(gameType, result, amount);
    await user.save();
    
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        balance: user.balance,
        isPlayingForFree: user.isPlayingForFree,
        freeGamesPlayed: user.freeGamesPlayed
      },
      gameResult: {
        gameType,
        result,
        amount,
        newBalance: user.balance
      }
    });
    
  } catch (error) {
    console.error('Error recording game result:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error recording game result' 
    });
  }
});

// Get user's game history
router.get('/history', auth, async (req, res) => {
  try {
    const { limit = 50, offset = 0, gameType } = req.query;
    const query = { userId: req.user._id };
    
    if (gameType) {
      query.gameType = gameType;
    }
    
    const history = await GameHistory.find(query)
      .sort({ timestamp: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));
    
    const total = await GameHistory.countDocuments(query);
    
    res.json({
      success: true,
      history,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('Error fetching game history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching game history' 
    });
  }
});

// Get user stats
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get total games played
    const totalGames = await GameHistory.countDocuments({ userId });
    
    // Get wins, losses, and draws
    const stats = await GameHistory.aggregate([
      { $match: { userId: userId } },
      { 
        $group: {
          _id: '$result',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $project: {
          _id: 0,
          result: '$_id',
          count: 1,
          totalAmount: 1
        }
      }
    ]);
    
    // Calculate win/loss ratio
    const wins = stats.find(s => s.result === 'win')?.count || 0;
    const losses = stats.find(s => s.result === 'loss')?.count || 0;
    const draws = stats.find(s => s.result === 'draw')?.count || 0;
    
    // Get favorite game
    const favoriteGame = await GameHistory.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$gameType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    
    res.json({
      success: true,
      stats: {
        totalGames,
        wins,
        losses,
        draws,
        winLossRatio: losses > 0 ? (wins / losses).toFixed(2) : wins > 0 ? '∞' : 0,
        favoriteGame: favoriteGame.length > 0 ? favoriteGame[0]._id : null,
        totalWon: stats.reduce((sum, s) => s.result === 'win' ? sum + s.totalAmount : sum, 0),
        totalLost: Math.abs(stats.reduce((sum, s) => s.result === 'loss' ? sum + s.totalAmount : sum, 0)),
        isPlayingForFree: req.user.isPlayingForFree,
        freeGamesPlayed: req.user.freeGamesPlayed
      }
    });
    
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching user stats' 
    });
  }
});

module.exports = router;
