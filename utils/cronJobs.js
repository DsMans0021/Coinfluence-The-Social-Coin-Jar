const GameHistory = require('../models/GameHistory');

// Clean up game history older than 12 hours
const cleanOldGameHistory = async () => {
  try {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    
    // Delete game history older than 12 hours
    const result = await GameHistory.deleteMany({
      timestamp: { $lt: twelveHoursAgo }
    });
    
    console.log(`Cleaned up ${result.deletedCount} old game history records`);
    
    // Also clean up game history in user documents
    const usersUpdate = await User.updateMany(
      {},
      { 
        $pull: { 
          gameHistory: { 
            timestamp: { $lt: twelveHoursAgo } 
          } 
        } 
      }
    );
    
    console.log(`Cleaned up old game history for ${usersUpdate.nModified} users`);
    
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error('Error cleaning up game history:', error);
    return { success: false, error: error.message };
  }
};

// Function to check and update user free game status
const checkAndUpdateFreeGameStatus = async () => {
  try {
    // Find users with zero or negative balance who aren't already in free mode
    const usersToUpdate = await User.find({
      balance: { $lte: 0 },
      isPlayingForFree: false
    });
    
    // Update users to free game mode
    const updatePromises = usersToUpdate.map(user => 
      User.findByIdAndUpdate(user._id, { 
        $set: { 
          isPlayingForFree: true,
          freeGamesPlayed: 0,
          lastFreeGameTime: new Date()
        } 
      })
    );
    
    await Promise.all(updatePromises);
    console.log(`Updated ${updatePromises.length} users to free game mode`);
    
    return { success: true, updatedCount: updatePromises.length };
  } catch (error) {
    console.error('Error updating free game status:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  cleanOldGameHistory,
  checkAndUpdateFreeGameStatus
};
