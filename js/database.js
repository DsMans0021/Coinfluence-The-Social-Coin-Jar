// Database reference
const db = firebase.database();

/**
 * Create or update user data in the database
 * @param {string} userId - The user's unique ID
 * @param {Object} userData - The user data to save
 * @returns {Promise} A promise that resolves when the data is saved
 */
const updateUserData = (userId, userData) => {
    return db.ref('users/' + userId).update(userData);
};

/**
 * Create new user data in the database
 * @param {string} userId - The user's unique ID
 * @param {Object} userData - The user data to save
 * @returns {Promise} A promise that resolves when the data is created
 */
const createUserData = (userId, userData) => {
    return db.ref('users/' + userId).set(userData);
};

/**
 * Get user data from the database
 * @param {string} userId - The user's unique ID
 * @returns {Promise<Object>} A promise that resolves with the user data
 */
const getUserData = (userId) => {
    return db.ref('users/' + userId).once('value')
        .then(snapshot => snapshot.val());
};

/**
 * Update user's balance
 * @param {string} userId - The user's unique ID
 * @param {number} amount - The amount to add (positive) or subtract (negative)
 * @param {boolean} isWin - Whether this is a win (true) or loss (false)
 * @param {number} betAmount - The amount that was bet
 * @returns {Promise} A promise that resolves when the update is complete
 */
const updateBalance = (userId, amount, isWin = false, betAmount = 0) => {
    return db.ref('users/' + userId).transaction((user) => {
        if (user) {
            // Initialize balance if it doesn't exist
            if (user.balance === undefined) {
                user.balance = 0;
            }
            
            // Initialize game stats if they don't exist
            if (user.gamesPlayed === undefined) user.gamesPlayed = 0;
            if (user.gamesWon === undefined) user.gamesWon = 0;
            if (user.totalWon === undefined) user.totalWon = 0;
            if (user.totalLost === undefined) user.totalLost = 0;
            
            // Update balance
            const newBalance = user.balance + amount;
            
            // Ensure balance doesn't go below 0
            if (newBalance < 0) {
                return; // Abort transaction if balance would go negative
            }
            
            // Update game stats
            user.balance = newBalance;
            user.gamesPlayed += 1;
            
            if (isWin) {
                user.gamesWon += 1;
                user.totalWon += amount;
            } else {
                user.totalLost += betAmount;
            }
            
            return user;
        }
        return null;
    });
};

/**
 * Load user data and update the UI
 */
const loadUserData = () => {
    const user = auth.currentUser;
    if (!user) return;
    
    return getUserData(user.uid)
        .then(userData => {
            if (userData) {
                // Update UI with user data
                updateUserUI(userData);
            }
            return userData;
        })
        .catch(error => {
            console.error('Error loading user data:', error);
        });
};

/**
 * Update the UI with user data
 * @param {Object} userData - The user data to display
 */
const updateUserUI = (userData) => {
    // Update balance in header
    const balanceElement = document.getElementById('user-balance');
    if (balanceElement) {
        balanceElement.textContent = `$${userData.balance?.toFixed(2) || '0.00'}`;
    }
    
    // Update profile page
    const profileUsername = document.getElementById('profile-username');
    const profileEmail = document.getElementById('profile-email');
    const profileBalance = document.getElementById('profile-balance');
    const gamesPlayed = document.getElementById('games-played');
    const gamesWon = document.getElementById('games-won');
    const totalWon = document.getElementById('total-won');
    const totalLost = document.getElementById('total-lost');
    const memberSince = document.getElementById('member-since');
    
    if (profileUsername) profileUsername.textContent = userData.username || 'User';
    if (profileEmail) profileEmail.textContent = userData.email || '';
    if (profileBalance) profileBalance.textContent = `$${userData.balance?.toFixed(2) || '0.00'}`;
    if (gamesPlayed) gamesPlayed.textContent = userData.gamesPlayed || '0';
    if (gamesWon) gamesWon.textContent = userData.gamesWon || '0';
    if (totalWon) totalWon.textContent = `$${userData.totalWon?.toFixed(2) || '0.00'}`;
    if (totalLost) totalLost.textContent = `$${userData.totalLost?.toFixed(2) || '0.00'}`;
    
    // Format and display member since date
    if (memberSince && userData.createdAt) {
        const date = new Date(userData.createdAt);
        memberSince.textContent = date.toLocaleDateString();
    }
};

// Export functions
window.dbFunctions = {
    updateUserData,
    createUserData,
    getUserData,
    updateBalance,
    loadUserData,
    updateUserUI
};
