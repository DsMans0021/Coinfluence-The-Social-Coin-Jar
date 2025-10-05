const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  balance: {
    type: Number,
    default: 1000, // Starting balance
    min: 0
  },
  isPlayingForFree: {
    type: Boolean,
    default: false
  },
  freeGamesPlayed: {
    type: Number,
    default: 0
  },
  lastFreeGameTime: {
    type: Date
  },
  gameHistory: [{
    gameType: String,
    result: String,
    amount: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user can play free game
userSchema.methods.canPlayFreeGame = function() {
  if (!this.isPlayingForFree) return false;
  
  const now = new Date();
  const lastGameTime = this.lastFreeGameTime || new Date(0);
  const hoursSinceLastGame = (now - lastGameTime) / (1000 * 60 * 60);
  
  return hoursSinceLastGame >= 1; // 1 hour cooldown between free games
};

// Method to update free game status
userSchema.methods.updateFreeGameStatus = function() {
  if (this.balance <= 0 && !this.isPlayingForFree) {
    this.isPlayingForFree = true;
    this.freeGamesPlayed = 0;
  } else if (this.balance > 0 && this.isPlayingForFree) {
    this.isPlayingForFree = false;
  }
};

// Method to add game result to history
userSchema.methods.addGameResult = function(gameType, result, amount) {
  this.gameHistory.push({
    gameType,
    result,
    amount
  });
  
  // Update balance
  this.balance += amount;
  
  // Update free game status
  this.updateFreeGameStatus();
  
  // Update free game tracking if applicable
  if (this.isPlayingForFree) {
    this.freeGamesPlayed += 1;
    this.lastFreeGameTime = new Date();
    
    // If user won enough in free games, switch back to normal mode
    if (this.balance >= 100) { // Example threshold
      this.isPlayingForFree = false;
    }
  }
};

// Index for frequently queried fields
userSchema.index({ username: 1, email: 1 });

// TTL index for game history (12 hours)
userSchema.index({ 'gameHistory.timestamp': 1 }, { expireAfterSeconds: 12 * 60 * 60 });

const User = mongoose.model('User', userSchema);

module.exports = User;
