const mongoose = require('mongoose');

const gameHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameType: {
    type: String,
    required: true,
    enum: ['slots', 'blackjack', 'poker', 'roulette', 'free']
  },
  result: {
    type: String,
    required: true,
    enum: ['win', 'loss', 'draw']
  },
  amount: {
    type: Number,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 43200 // 12 hours in seconds
  }
});

// Indexes for faster queries
gameHistorySchema.index({ userId: 1, timestamp: -1 });
gameHistorySchema.index({ gameType: 1, timestamp: -1 });

const GameHistory = mongoose.model('GameHistory', gameHistorySchema);

module.exports = GameHistory;
