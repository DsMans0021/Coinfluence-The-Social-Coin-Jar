// Game state
let currentUser = null;
let gameState = {
    balance: 0,
    isPlayingForFree: false,
    currentGame: null,
    betAmount: 10,
    gameHistory: []
};

// DOM Elements
const authModal = document.getElementById('authModal');
const gameContainer = document.getElementById('gameContainer');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const userBalance = document.getElementById('userBalance');
const freePlayBadge = document.getElementById('freePlayBadge');
const usernameDisplay = document.getElementById('usernameDisplay');
const userMenuButton = document.getElementById('userMenuButton');
const userDropdown = document.getElementById('userDropdown');
const gameLog = document.getElementById('gameLog');

// Game modals
const profileModal = document.getElementById('profileModal');
const addFundsModal = document.getElementById('addFundsModal');
const gameHistoryModal = document.getElementById('gameHistoryModal');
const leaderboardModal = document.getElementById('leaderboardModal');

// Game elements
const gameArea = document.getElementById('gameArea');
const coinFlipGame = document.getElementById('coinFlipGame');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
        // Validate token and load user data
        validateToken(token);
    } else {
        showAuthModal();
    }

    // Event listeners
    setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
    // User menu toggle
    if (userMenuButton) {
        userMenuButton.addEventListener('click', () => {
            userDropdown.classList.toggle('hidden');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!userMenuButton.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.add('hidden');
        }
    });
}

// Show authentication modal
function showAuthModal(showLogin = true) {
    authModal.classList.remove('hidden');
    if (showLogin) {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    }
}

// Toggle between login and signup forms
function toggleForms() {
    loginForm.classList.toggle('hidden');
    signupForm.classList.toggle('hidden');
}

// Validate JWT token
async function validateToken(token) {
    try {
        // In a real app, you would validate the token with your backend
        // For demo purposes, we'll just check if it exists
        if (!token) {
            throw new Error('No token found');
        }

        // Decode the token to get user info (without verification for demo)
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Set current user
        currentUser = {
            id: payload.userId,
            username: payload.username || 'User',
            email: payload.email || '',
            balance: 1000, // Default balance for demo
            isPlayingForFree: false
        };

        // Load user data from localStorage
        loadUserData();
        
        // Update UI
        updateUI();
        
        // Hide auth modal and show game container
        authModal.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        
    } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('token');
        showAuthModal();
    }
}

// Load user data from localStorage
function loadUserData() {
    if (!currentUser) return;
    
    const userData = localStorage.getItem(`user_${currentUser.id}`);
    if (userData) {
        const data = JSON.parse(userData);
        currentUser = { ...currentUser, ...data };
    }
    
    // Initialize game state
    gameState.balance = currentUser.balance || 0;
    gameState.isPlayingForFree = currentUser.isPlayingForFree || false;
    
    // Load game history
    const history = localStorage.getItem(`history_${currentUser.id}`);
    if (history) {
        gameState.gameHistory = JSON.parse(history);
    }
    
    // Check if user is in free play mode
    checkFreePlayMode();
}

// Save user data to localStorage
function saveUserData() {
    if (!currentUser) return;
    
    // Update current user data
    currentUser.balance = gameState.balance;
    currentUser.isPlayingForFree = gameState.isPlayingForFree;
    
    // Save to localStorage
    localStorage.setItem(`user_${currentUser.id}`, JSON.stringify({
        username: currentUser.username,
        email: currentUser.email,
        balance: currentUser.balance,
        isPlayingForFree: currentUser.isPlayingForFree,
        lastPlayed: new Date().toISOString()
    }));
    
    // Save game history
    localStorage.setItem(`history_${currentUser.id}`, JSON.stringify(gameState.gameHistory));
    
    // Update UI
    updateUI();
}

// Check if user should be in free play mode
function checkFreePlayMode() {
    if (gameState.balance <= 0 && !gameState.isPlayingForFree) {
        // User ran out of money, switch to free play mode
        gameState.isPlayingForFree = true;
        gameState.balance = 0;
        addToGameLog('You ran out of money! Free play mode activated.', 'warning');
        saveUserData();
    } else if (gameState.balance > 0 && gameState.isPlayingForFree) {
        // User has money again, disable free play mode
        gameState.isPlayingForFree = false;
        addToGameLog('Welcome back! Free play mode deactivated.', 'success');
        saveUserData();
    }
}

// Update UI with current user data
function updateUI() {
    if (!currentUser) return;
    
    // Update balance display
    userBalance.textContent = `$${gameState.balance.toLocaleString()}`;
    
    // Update username display
    usernameDisplay.textContent = currentUser.username;
    
    // Update free play badge
    if (gameState.isPlayingForFree) {
        freePlayBadge.classList.remove('hidden');
    } else {
        freePlayBadge.classList.add('hidden');
    }
    
    // Update game balance if in game
    const gameBalance = document.getElementById('gameBalance');
    if (gameBalance) {
        gameBalance.textContent = gameState.balance.toLocaleString();
    }
    
    // Update free play info in game
    const freePlayInfo = document.getElementById('freePlayInfo');
    if (freePlayInfo) {
        if (gameState.isPlayingForFree) {
            freePlayInfo.classList.remove('hidden');
        } else {
            freePlayInfo.classList.add('hidden');
        }
    }
}

// Add entry to game log
function addToGameLog(message, type = 'info') {
    const entry = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString();
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    else if (type === 'error') icon = '❌';
    else if (type === 'warning') icon = '⚠️';
    else if (type === 'win') icon = '💰';
    else if (type === 'loss') icon = '💸';
    
    entry.innerHTML = `<span class="text-gray-500 text-xs">[${timestamp}]</span> ${icon} ${message}`;
    entry.className = `py-1 border-b border-gray-700 ${type}`;
    
    gameLog.insertBefore(entry, gameLog.firstChild);
    
    // Limit log entries
    if (gameLog.children.length > 100) {
        gameLog.removeChild(gameLog.lastChild);
    }
}

// Start a game
function startGame(gameName) {
    // Hide all game UIs
    const gameElements = document.querySelectorAll('[id$="Game"]');
    gameElements.forEach(el => {
        if (el.id !== 'gameContainer') {
            el.classList.add('hidden');
        }
    });
    
    // Show the selected game
    const gameElement = document.getElementById(`${gameName}Game`);
    if (gameElement) {
        gameElement.classList.remove('hidden');
        gameArea.innerHTML = '';
        gameArea.appendChild(gameElement);
        gameState.currentGame = gameName;
        
        // Update game balance
        const gameBalance = document.getElementById('gameBalance');
        if (gameBalance) {
            gameBalance.textContent = gameState.balance.toLocaleString();
        }
        
        // Initialize game-specific UI
        if (gameName === 'coinFlip') {
            initCoinFlip();
        } else if (gameName === 'slots') {
            initSlots();
        } else if (gameName === 'blackjack') {
            initBlackjack();
        }
        
        addToGameLog(`Started ${gameName} game`);
    }
}

// Coin Flip Game
function initCoinFlip() {
    const betAmountInput = document.getElementById('betAmount');
    if (betAmountInput) {
        betAmountInput.value = gameState.betAmount;
        betAmountInput.addEventListener('change', (e) => {
            const value = parseInt(e.target.value) || 0;
            gameState.betAmount = Math.max(1, Math.min(value, gameState.isPlayingForFree ? 0 : gameState.balance));
            e.target.value = gameState.betAmount;
        });
    }
}

// Adjust bet amount
function adjustBet(amount) {
    const newBet = gameState.betAmount + amount;
    if (newBet >= 1 && (gameState.isPlayingForFree || newBet <= gameState.balance)) {
        gameState.betAmount = newBet;
        const betAmountInput = document.getElementById('betAmount');
        if (betAmountInput) {
            betAmountInput.value = gameState.betAmount;
        }
    }
}

// Set bet to percentage of balance
function setBetPercentage(percentage) {
    if (gameState.isPlayingForFree) {
        gameState.betAmount = 10; // Default bet for free play
    } else {
        gameState.betAmount = Math.max(1, Math.floor(gameState.balance * percentage));
    }
    
    const betAmountInput = document.getElementById('betAmount');
    if (betAmountInput) {
        betAmountInput.value = gameState.betAmount;
    }
}

// Place a bet in the coin flip game
function placeBet(choice) {
    if (gameState.isPlayingForFree) {
        playCoinFlip(choice);
    } else if (gameState.betAmount > gameState.balance) {
        addToGameLog('Insufficient balance!', 'error');
    } else {
        playCoinFlip(choice);
    }
}

// Play the coin flip game
function playCoinFlip(choice) {
    const coin = document.getElementById('coin');
    const resultDisplay = document.getElementById('coinResult');
    const headsBtn = document.getElementById('headsBtn');
    const tailsBtn = document.getElementById('tailsBtn');
    
    // Disable buttons during flip
    if (headsBtn) headsBtn.disabled = true;
    if (tailsBtn) tailsBtn.disabled = true;
    
    // Add flipping animation
    coin.classList.add('flipping');
    
    // Random result (heads or tails)
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const isWin = choice === result;
    
    // Calculate winnings (double the bet for a win)
    const winAmount = isWin ? gameState.betAmount * 2 : 0;
    
    // Update balance
    if (gameState.isPlayingForFree) {
        // In free play mode, user can't win real money
        addToGameLog(`You ${isWin ? 'won' : 'lost'} a free game!`, isWin ? 'win' : 'loss');
    } else {
        gameState.balance += isWin ? gameState.betAmount : -gameState.betAmount;
        addToGameLog(`You ${isWin ? 'won' : 'lost'} $${gameState.betAmount} on ${choice}! ${isWin ? `+$${gameState.betAmount}` : ''}`, isWin ? 'win' : 'loss');
    }
    
    // Show result after animation
    setTimeout(() => {
        coin.classList.remove('flipping');
        coin.innerHTML = result === 'heads' ? '👑' : '🪙';
        
        if (resultDisplay) {
            resultDisplay.textContent = `It's ${result}!`;
            resultDisplay.className = `mt-4 text-xl font-bold ${isWin ? 'text-green-500' : 'text-red-500'}`;
            resultDisplay.classList.remove('hidden');
        }
        
        // Re-enable buttons
        if (headsBtn) headsBtn.disabled = false;
        if (tailsBtn) tailsBtn.disabled = false;
        
        // Check for free play mode
        checkFreePlayMode();
        
        // Save user data
        saveUserData();
        
    }, 1000);
}

// Show profile modal
function showProfile() {
    if (!currentUser) return;
    
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileBalance').textContent = `$${gameState.balance.toLocaleString()}`;
    
    const freePlayInfo = document.getElementById('freePlayInfo');
    if (gameState.isPlayingForFree) {
        freePlayInfo.classList.remove('hidden');
    } else {
        freePlayInfo.classList.add('hidden');
    }
    
    profileModal.classList.remove('hidden');
}

// Show add funds modal
function showAddFunds() {
    addFundsModal.classList.remove('hidden');
    profileModal.classList.add('hidden');
}

// Select amount to add
function selectAmount(amount) {
    document.getElementById('customAmount').value = amount;
}

// Add funds to account
function addFunds() {
    const amountInput = document.getElementById('customAmount');
    const amount = parseFloat(amountInput.value) || 0;
    
    if (amount <= 0) {
        addToGameLog('Please enter a valid amount', 'error');
        return;
    }
    
    // In a real app, this would connect to a payment processor
    gameState.balance += amount;
    
    // Check if we should disable free play mode
    if (gameState.balance > 0 && gameState.isPlayingForFree) {
        gameState.isPlayingForFree = false;
        addToGameLog(`$${amount} added to your account. Welcome back!`, 'success');
    } else {
        addToGameLog(`$${amount} added to your account`, 'success');
    }
    
    // Save and update UI
    saveUserData();
    updateUI();
    
    // Close modals
    addFundsModal.classList.add('hidden');
    profileModal.classList.add('hidden');
}

// Show game history
function showGameHistory() {
    // In a real app, this would fetch history from the server
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = `
        <div class="text-center py-8 text-gray-500">
            <i class="fas fa-history text-4xl mb-2"></i>
            <p>No game history found</p>
        </div>
    `;
    
    // For demo, show some sample history
    if (gameState.gameHistory && gameState.gameHistory.length > 0) {
        historyList.innerHTML = '';
        gameState.gameHistory.slice(0, 10).forEach(entry => {
            const item = document.createElement('div');
            item.className = 'py-2 border-b border-gray-700';
            item.innerHTML = `
                <div class="flex justify-between">
                    <span>${entry.game}</span>
                    <span class="${entry.win ? 'text-green-400' : 'text-red-400'}">${entry.win ? '+' : '-'}$${entry.amount}</span>
                </div>
                <div class="text-xs text-gray-500">${new Date(entry.timestamp).toLocaleString()}</div>
            `;
            historyList.appendChild(item);
        });
    }
    
    // Update stats
    const wins = gameState.gameHistory ? gameState.gameHistory.filter(g => g.win).length : 0;
    const losses = gameState.gameHistory ? gameState.gameHistory.filter(g => !g.win).length : 0;
    const totalWon = gameState.gameHistory 
        ? gameState.gameHistory.filter(g => g.win).reduce((sum, g) => sum + g.amount, 0)
        : 0;
    const totalLost = gameState.gameHistory 
        ? gameState.gameHistory.filter(g => !g.win).reduce((sum, g) => sum + g.amount, 0)
        : 0;
    
    document.getElementById('totalGames').textContent = wins + losses;
    document.getElementById('totalWins').textContent = wins;
    document.getElementById('totalLosses').textContent = losses;
    document.getElementById('netResult').textContent = `$${(totalWon - totalLost).toFixed(2)}`;
    document.getElementById('netResult').className = `font-medium ${(totalWon - totalLost) >= 0 ? 'text-green-400' : 'text-red-400'}`;
    
    gameHistoryModal.classList.remove('hidden');
}

// Show leaderboard
function showLeaderboard() {
    // In a real app, this would fetch leaderboard from the server
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = `
        <tr>
            <td colspan="5" class="py-8 text-center text-gray-500">
                <i class="fas fa-trophy text-4xl mb-2 block"></i>
                <p>Loading leaderboard...</p>
            </td>
        </tr>
    `;
    
    // For demo, show sample leaderboard
    setTimeout(() => {
        const sampleData = [
            { rank: 1, username: 'CryptoKing', profit: 12500, wins: 42 },
            { rank: 2, username: 'LuckyDuck', profit: 9870, wins: 38 },
            { rank: 3, username: 'HighRoller', profit: 8450, wins: 35 },
            { rank: 4, username: currentUser.username, profit: 3200, wins: 28 },
            { rank: 5, username: 'Gambit', profit: 2850, wins: 25 }
        ];
        
        leaderboardList.innerHTML = '';
        sampleData.forEach(player => {
            const isCurrentUser = player.username === currentUser.username;
            const row = document.createElement('tr');
            row.className = `border-b border-gray-700 ${isCurrentUser ? 'bg-gray-700' : ''}`;
            row.innerHTML = `
                <td class="py-3">
                    <span class="inline-flex items-center justify-center w-6 h-6 rounded-full ${player.rank <= 3 ? 'bg-yellow-500 text-black' : 'bg-gray-700'} text-sm font-bold">
                        ${player.rank}
                    </span>
                </td>
                <td class="py-3">
                    ${player.username} 
                    ${isCurrentUser ? '<span class="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full ml-2">You</span>' : ''}
                </td>
                <td class="py-3 text-right font-mono">
                    <span class="${player.profit >= 0 ? 'text-green-400' : 'text-red-400'}">
                        ${player.profit >= 0 ? '+' : ''}$${player.profit.toLocaleString()}
                    </span>
                </td>
                <td class="py-3 text-right">${player.wins}</td>
                <td class="py-3 text-right">${Math.round((player.wins / (player.wins + 10)) * 100)}%</td>
            `;
            leaderboardList.appendChild(row);
        });
        
        // Update user stats
        const userData = sampleData.find(p => p.username === currentUser.username) || 
                         { rank: sampleData.length + 1, profit: 0, wins: 0 };
        
        document.getElementById('userRank').textContent = `#${userData.rank}`;
        document.getElementById('userProfit').textContent = `$${userData.profit.toLocaleString()}`;
        document.getElementById('userProfit').className = `font-medium ${userData.profit >= 0 ? 'text-green-400' : 'text-red-400'}`;
        
    }, 500);
    
    leaderboardModal.classList.remove('hidden');
}

// Close any modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Logout user
function logout() {
    // Clear user data
    currentUser = null;
    gameState = {
        balance: 0,
        isPlayingForFree: false,
        currentGame: null,
        betAmount: 10,
        gameHistory: []
    };
    
    // Clear token
    localStorage.removeItem('token');
    
    // Show auth modal
    showAuthModal();
    
    // Hide game container
    gameContainer.classList.add('hidden');
    
    // Clear game area
    gameArea.innerHTML = '<p class="text-gray-500">Select a game to start playing!</p>';
    
    // Clear game log
    gameLog.innerHTML = '';
}

// Login user (demo version)
function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        addToGameLog('Please enter both email and password', 'error');
        return;
    }
    
    // In a real app, this would validate with your backend
    // For demo, we'll just create a fake token
    const fakeToken = btoa(JSON.stringify({
        userId: 'demo-user-' + Math.random().toString(36).substr(2, 9),
        username: email.split('@')[0],
        email: email
    }));
    
    // Save token to localStorage
    localStorage.setItem('token', fakeToken);
    
    // Validate token and load user data
    validateToken(fakeToken);
    
    addToGameLog('Login successful!', 'success');
}

// Sign up new user (demo version)
function signup() {
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    if (!username || !email || !password) {
        addToGameLog('Please fill in all fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        addToGameLog('Password must be at least 6 characters', 'error');
        return;
    }
    
    // In a real app, this would create a new user in your backend
    // For demo, we'll just create a fake token
    const fakeToken = btoa(JSON.stringify({
        userId: 'demo-user-' + Math.random().toString(36).substr(2, 9),
        username: username,
        email: email
    }));
    
    // Save token to localStorage
    localStorage.setItem('token', fakeToken);
    
    // Validate token and load user data
    validateToken(fakeToken);
    
    addToGameLog('Account created successfully!', 'success');
}

// Initialize slots game (placeholder)
function initSlots() {
    gameArea.innerHTML = `
        <div class="text-center">
            <h3 class="text-xl font-bold mb-6">Slots</h3>
            <div class="bg-gray-800 p-6 rounded-lg inline-block">
                <div class="flex justify-center space-x-4 mb-6">
                    <div class="slot bg-gray-700 w-16 h-16 flex items-center justify-center text-3xl rounded">🍒</div>
                    <div class="slot bg-gray-700 w-16 h-16 flex items-center justify-center text-3xl rounded">🍋</div>
                    <div class="slot bg-gray-700 w-16 h-16 flex items-center justify-center text-3xl rounded">🍊</div>
                </div>
                <button onclick="spinSlots()" class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg">
                    SPIN
                </button>
            </div>
            <p class="mt-6 text-gray-400">Slots coming soon! Try Coin Flip for now.</p>
        </div>
    `;
}

// Initialize blackjack game (placeholder)
function initBlackjack() {
    gameArea.innerHTML = `
        <div class="text-center">
            <h3 class="text-xl font-bold mb-6">Blackjack</h3>
            <div class="bg-gray-800 p-6 rounded-lg inline-block">
                <div class="mb-6">
                    <h4 class="text-lg font-semibold mb-2">Dealer's Hand</h4>
                    <div class="flex justify-center space-x-2 mb-4">
                        <div class="w-12 h-16 bg-blue-700 rounded flex items-center justify-center text-xl">🂠</div>
                        <div class="w-12 h-16 bg-blue-700 rounded flex items-center justify-center text-xl">🃏</div>
                    </div>
                    
                    <h4 class="text-lg font-semibold mb-2 mt-6">Your Hand (15)</h4>
                    <div class="flex justify-center space-x-2 mb-6">
                        <div class="w-12 h-16 bg-green-700 rounded flex items-center justify-center text-xl">10♠</div>
                        <div class="w-12 h-16 bg-green-700 rounded flex items-center justify-center text-xl">5♥</div>
                    </div>
                </div>
                
                <div class="space-x-4">
                    <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Hit
                    </button>
                    <button class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                        Stand
                    </button>
                    <button class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
                        Double Down
                    </button>
                </div>
            </div>
            <p class="mt-6 text-gray-400">Blackjack coming soon! Try Coin Flip for now.</p>
        </div>
    `;
}

// Spin slots (placeholder)
function spinSlots() {
    // This would be implemented for a real slots game
    addToGameLog('Slots game is coming soon! Try Coin Flip for now.', 'info');
}

// Clean up old game history (runs every 12 hours)
function cleanupOldGameHistory() {
    if (!currentUser) return;
    
    const now = new Date().getTime();
    const twelveHoursAgo = now - (12 * 60 * 60 * 1000);
    
    // Filter out entries older than 12 hours
    if (gameState.gameHistory) {
        const initialCount = gameState.gameHistory.length;
        gameState.gameHistory = gameState.gameHistory.filter(entry => {
            return new Date(entry.timestamp).getTime() > twelveHoursAgo;
        });
        
        if (gameState.gameHistory.length < initialCount) {
            console.log(`Cleaned up ${initialCount - gameState.gameHistory.length} old game history entries`);
            saveUserData();
        }
    }
}

// Run cleanup every 12 hours
setInterval(cleanupOldGameHistory, 12 * 60 * 60 * 1000);
