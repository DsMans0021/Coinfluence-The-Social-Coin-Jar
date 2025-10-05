// Game library data
const games = [
    {
        id: 'coin-flip',
        name: 'Coin Flip',
        description: 'Heads or tails? Double your money or lose it all!',
        icon: 'fa-coins',
        minBet: 10,
        maxBet: 1000,
        isFreePlay: false
    },
    {
        id: 'free-slots',
        name: 'Free Slots',
        description: 'Try your luck with our free slot machine!',
        icon: 'fa-sliders-h',
        minBet: 0,
        maxBet: 0,
        isFreePlay: true
    },
    {
        id: 'blackjack',
        name: 'Blackjack',
        description: 'Beat the dealer without going over 21!',
        icon: 'fa-club',
        minBet: 20,
        maxBet: 500,
        isFreePlay: false,
        comingSoon: true
    },
    {
        id: 'roulette',
        name: 'Roulette',
        description: 'Place your bets on red, black, or specific numbers!',
        icon: 'fa-circle',
        minBet: 5,
        maxBet: 1000,
        isFreePlay: false,
        comingSoon: true
    }
];

// Initialize game library
function initGameLibrary() {
    const gameLibrary = document.getElementById('gameLibrary');
    if (!gameLibrary) return;
    
    gameLibrary.innerHTML = games.map(game => `
        <div class="game-card bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
            <div class="p-6">
                <div class="flex items-center mb-4">
                    <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl text-blue-500 mr-4">
                        <i class="fas ${game.icon}"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800">${game.name}</h3>
                    ${game.comingSoon ? '<span class="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Coming Soon</span>' : ''}
                </div>
                <p class="text-gray-600 mb-4">${game.description}</p>
                <button onclick="loadGame('${game.id}')" 
                        class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition ${game.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}"
                        ${game.comingSoon ? 'disabled' : ''}>
                    ${game.comingSoon ? 'Coming Soon' : 'Play Now'}
                </button>
            </div>
        </div>
    `).join('');
}

// Load game into the game container
function loadGame(gameId) {
    const game = games.find(g => g.id === gameId);
    if (!game) return;
    
    const gameContainer = document.getElementById('gameContainer');
    
    // Hide main app and show game container
    document.getElementById('app').classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    // Load game-specific HTML
    switch(gameId) {
        case 'coin-flip':
            loadCoinFlipGame();
            break;
        case 'free-slots':
            loadFreeSlotsGame();
            break;
        default:
            gameContainer.innerHTML = `
                <div class="game-container">
                    <h2 class="text-2xl font-bold mb-4">${game.name}</h2>
                    <p>This game is coming soon!</p>
                    <button onclick="backToLobby()" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg">
                        Back to Lobby
                    </button>
                </div>
            `;
    }
}

// Back to lobby from game
function backToLobby() {
    document.getElementById('gameContainer').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('gameContainer').innerHTML = '';
}

// Load game history
function loadGameHistory(userId) {
    const gameHistory = document.getElementById('gameHistory');
    if (!gameHistory) return;
    
    const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
    
    gamesRef.orderByChild('timestamp')
        .startAt(twelveHoursAgo)
        .on('value', (snapshot) => {
            const history = [];
            snapshot.forEach((childSnapshot) => {
                const game = childSnapshot.val();
                if (game.userId === userId) {
                    history.push({
                        id: childSnapshot.key,
                        ...game
                    });
                }
            });
            
            // Sort by timestamp (newest first)
            history.sort((a, b) => b.timestamp - a.timestamp);
            
            // Update UI
            updateGameHistoryUI(history);
            
            // Clean up old games (older than 12 hours)
            cleanupOldGames();
        });
}

// Update game history UI
function updateGameHistoryUI(history) {
    const gameHistory = document.getElementById('gameHistory');
    if (!gameHistory) return;
    
    if (history.length === 0) {
        gameHistory.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                <p>No recent games. Play a game to see your history here!</p>
            </div>
        `;
        return;
    }
    
    gameHistory.innerHTML = `
        <div class="divide-y divide-gray-200">
            ${history.slice(0, 10).map(game => `
                <div class="p-4 hover:bg-gray-50 transition">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-medium text-gray-900">${game.gameName}</h4>
                            <p class="text-sm text-gray-500">${new Date(game.timestamp).toLocaleString()}</p>
                        </div>
                        <span class="px-2.5 py-0.5 rounded-full text-sm font-medium ${
                            game.outcome === 'win' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }">
                            ${game.outcome === 'win' ? `+${game.amountWon}` : `-${game.amountBet}`}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Clean up games older than 12 hours
function cleanupOldGames() {
    const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
    
    gamesRef.orderByChild('timestamp')
        .endAt(twelveHoursAgo)
        .once('value', (snapshot) => {
            const updates = {};
            snapshot.forEach((child) => {
                updates[child.key] = null;
            });
            
            if (Object.keys(updates).length > 0) {
                gamesRef.update(updates);
            }
        });
}

// Record game result
function recordGameResult(gameName, amountBet, amountWon, outcome) {
    const user = auth.currentUser;
    if (!user) return;
    
    const gameData = {
        userId: user.uid,
        gameName: gameName,
        amountBet: amountBet,
        amountWon: amountWon,
        outcome: outcome,
        timestamp: Date.now()
    };
    
    // Push to database
    gamesRef.push(gameData);
    
    // Update user balance if not free play
    if (amountBet > 0) {
        updateUserBalance(user.uid, amountWon - amountBet);
    }
}

// Update user balance
function updateUserBalance(userId, amount) {
    const userRef = usersRef.child(userId);
    
    userRef.transaction((user) => {
        if (user) {
            const newBalance = user.balance + amount;
            
            // Check if balance goes below 0
            if (newBalance < 0) {
                // Switch to free play mode if balance is negative
                user.balance = 0;
                user.isFreePlay = true;
                showNotification('You\'re out of coins! Free play mode activated.', 'warning');
            } else {
                user.balance = newBalance;
                
                // Check if they can exit free play mode
                if (user.isFreePlay && newBalance >= 100) {
                    user.isFreePlay = false;
                    showNotification('Welcome back to real money games!', 'success');
                }
            }
        }
        return user;
    });
}

// Refresh game history
function refreshHistory() {
    const user = auth.currentUser;
    if (user) {
        loadGameHistory(user.uid);
        showNotification('Game history refreshed!', 'info');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initGameLibrary();
    
    // Set up back to lobby button
    document.addEventListener('click', (e) => {
        if (e.target && e.target.matches('.back-to-lobby')) {
            backToLobby();
        }
    });
});
