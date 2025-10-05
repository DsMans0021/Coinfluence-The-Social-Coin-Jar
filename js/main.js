// Global game state
let currentGame = null;
let currentBet = 10;
let isFlipping = false;
let slotSpinning = false;
let slotResult = [];

// DOM Elements
let coinElement, betAmountElement, headsButton, tailsButton, spinButton, slotReels, resultElement;

// Initialize games
document.addEventListener('DOMContentLoaded', () => {
    // Initialize game elements when they're loaded
    document.addEventListener('gameLoaded', (e) => {
        if (e.detail.gameId === 'coin-flip') {
            initCoinFlip();
        } else if (e.detail.gameId === 'free-slots') {
            initFreeSlots();
        }
    });
});

// Coin Flip Game
function loadCoinFlipGame() {
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.innerHTML = `
        <div class="game-container">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold">Coin Flip</h2>
                <button onclick="backToLobby()" class="text-blue-500 hover:text-blue-700">
                    <i class="fas fa-arrow-left"></i> Back to Lobby
                </button>
            </div>
            
            <div class="game-board">
                <div class="relative w-40 h-40 mx-auto my-8">
                    <div id="coin" class="coin w-full h-full bg-yellow-400 rounded-full flex items-center justify-center text-4xl">
                        <i class="fas fa-question"></i>
                    </div>
                </div>
                
                <div class="text-center mb-6">
                    <p class="text-lg font-medium mb-2">Bet Amount: <span id="betAmount">10</span> coins</p>
                    <div class="flex justify-center space-x-2 mb-4">
                        <button onclick="adjustBet(-10)" class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            -10
                        </button>
                        <button onclick="adjustBet(-1)" class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            -1
                        </button>
                        <button onclick="adjustBet(1)" class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            +1
                        </button>
                        <button onclick="adjustBet(10)" class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            +10
                        </button>
                    </div>
                </div>
                
                <div class="flex justify-center space-x-4 mb-6">
                    <button id="headsButton" class="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition">
                        <i class="fas fa-heading mr-2"></i>Heads
                    </button>
                    <button id="tailsButton" class="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition">
                        <i class="fas fa-coins mr-2"></i>Tails
                    </button>
                </div>
                
                <div id="result" class="text-center text-xl font-semibold min-h-8"></div>
            </div>
        </div>
    `;
    
    // Dispatch event that game is loaded
    document.dispatchEvent(new CustomEvent('gameLoaded', { detail: { gameId: 'coin-flip' } }));
}

function initCoinFlip() {
    // Get DOM elements
    coinElement = document.getElementById('coin');
    betAmountElement = document.getElementById('betAmount');
    headsButton = document.getElementById('headsButton');
    tailsButton = document.getElementById('tailsButton');
    resultElement = document.getElementById('result');
    
    // Set initial bet amount
    currentBet = 10;
    updateBetDisplay();
    
    // Add event listeners
    headsButton.addEventListener('click', () => flipCoin('heads'));
    tailsButton.addEventListener('click', () => flipCoin('tails'));
}

function adjustBet(amount) {
    const newBet = currentBet + amount;
    const minBet = 1;
    const maxBet = auth.currentUser?.isFreePlay ? 0 : 1000; // 0 means no limit in free play
    
    if (newBet >= minBet && (maxBet === 0 || newBet <= maxBet)) {
        currentBet = newBet;
        updateBetDisplay();
    }
}

function updateBetDisplay() {
    if (betAmountElement) {
        betAmountElement.textContent = currentBet;
    }
}

async function flipCoin(choice) {
    if (isFlipping) return;
    
    const user = auth.currentUser;
    if (!user) {
        showNotification('Please log in to play', 'error');
        return;
    }
    
    // Check if user has enough balance (only for real money games)
    const userData = await usersRef.child(user.uid).once('value').then(snap => snap.val());
    if (!userData.isFreePlay && currentBet > userData.balance) {
        showNotification('Not enough coins!', 'error');
        return;
    }
    
    isFlipping = true;
    resultElement.textContent = '';
    
    // Disable buttons during flip
    headsButton.disabled = true;
    tailsButton.disabled = true;
    
    // Add flipping animation
    coinElement.classList.add('flipping');
    
    // Simulate coin flip
    const flipResult = Math.random() < 0.5 ? 'heads' : 'tails';
    const isWin = flipResult === choice;
    
    // Determine win/loss
    const winAmount = isWin ? currentBet * 2 : 0;
    const outcome = isWin ? 'win' : 'loss';
    
    // Show result after animation
    setTimeout(() => {
        // Update coin to show result
        coinElement.innerHTML = flipResult === 'heads' ? 
            '<i class="fas fa-heading"></i>' : 
            '<i class="fas fa-coins"></i>';
        
        // Show result
        if (isWin) {
            resultElement.textContent = `You won ${winAmount} coins!`;
            resultElement.className = 'text-center text-xl font-semibold min-h-8 text-green-600';
            
            // Add confetti effect for big wins
            if (winAmount >= 500) {
                showConfetti();
            }
        } else {
            resultElement.textContent = 'Better luck next time!';
            resultElement.className = 'text-center text-xl font-semibold min-h-8 text-red-600';
        }
        
        // Record the game result
        if (!userData.isFreePlay) {
            recordGameResult('Coin Flip', currentBet, winAmount, outcome);
        } else {
            // In free play, they can't lose money, but can win some
            if (isWin) {
                updateUserBalance(user.uid, winAmount);
            }
        }
        
        // Re-enable buttons
        headsButton.disabled = false;
        tailsButton.disabled = false;
        isFlipping = false;
        
        // Reset coin after a delay
        setTimeout(() => {
            coinElement.classList.remove('flipping');
            coinElement.innerHTML = '<i class="fas fa-question"></i>';
        }, 2000);
        
    }, 2000);
}

// Free Slots Game
function loadFreeSlotsGame() {
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.innerHTML = `
        <div class="game-container">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold">Free Slots</h2>
                <button onclick="backToLobby()" class="text-blue-500 hover:text-blue-700">
                    <i class="fas fa-arrow-left"></i> Back to Lobby
                </button>
            </div>
            
            <div class="game-board">
                <div class="slot-machine bg-gray-100 p-6 rounded-lg shadow-inner">
                    <div class="flex justify-center space-x-2 mb-6" id="slotReels">
                        <div class="slot w-20 h-20 bg-white rounded-lg flex items-center justify-center text-3xl font-bold">🍒</div>
                        <div class="slot w-20 h-20 bg-white rounded-lg flex items-center justify-center text-3xl font-bold">🍋</div>
                        <div class="slot w-20 h-20 bg-white rounded-lg flex items-center justify-center text-3xl font-bold">🍊</div>
                    </div>
                    
                    <div class="text-center">
                        <button id="spinButton" class="px-8 py-3 bg-green-500 text-white rounded-full font-bold text-lg hover:bg-green-600 transition">
                            SPIN
                        </button>
                    </div>
                </div>
                
                <div id="slotResult" class="text-center mt-6 text-xl font-semibold min-h-8"></div>
                <div id="slotWinnings" class="text-center text-lg text-green-600 font-medium"></div>
            </div>
            
            <div class="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 class="font-bold mb-2">How to Play:</h3>
                <ul class="text-sm text-gray-700 space-y-1">
                    <li>• 3 Cherries: Win 10 coins</li>
                    <li>• 3 Lemons: Win 20 coins</li>
                    <li>• 3 Oranges: Win 30 coins</li>
                    <li>• 3 7's: Jackpot! Win 100 coins</li>
                </ul>
            </div>
        </div>
    `;
    
    // Dispatch event that game is loaded
    document.dispatchEvent(new CustomEvent('gameLoaded', { detail: { gameId: 'free-slots' } }));
}

function initFreeSlots() {
    // Get DOM elements
    slotReels = document.getElementById('slotReels');
    spinButton = document.getElementById('spinButton');
    resultElement = document.getElementById('slotResult');
    winningsElement = document.getElementById('slotWinnings');
    
    // Initialize slot symbols
    const symbols = ['🍒', '🍋', '🍊', '7️⃣'];
    
    // Add event listener for spin button
    spinButton.addEventListener('click', () => {
        if (slotSpinning) return;
        spinSlots(symbols);
    });
}

function spinSlots(symbols) {
    if (slotSpinning) return;
    
    slotSpinning = true;
    resultElement.textContent = '';
    winningsElement.textContent = '';
    
    // Disable spin button during spin
    spinButton.disabled = true;
    
    // Generate random result
    slotResult = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
    ];
    
    // Calculate winnings
    let winnings = 0;
    let winMessage = '';
    
    // Check for wins
    if (slotResult[0] === slotResult[1] && slotResult[1] === slotResult[2]) {
        // All three symbols match
        switch(slotResult[0]) {
            case '🍒':
                winnings = 10;
                winMessage = 'Cherry Bonus!';
                break;
            case '🍋':
                winnings = 20;
                winMessage = 'Lemon Jackpot!';
                break;
            case '🍊':
                winnings = 30;
                winMessage = 'Orange Delight!';
                break;
            case '7️⃣':
                winnings = 100;
                winMessage = 'JACKPOT! 777!';
                break;
        }
    }
    
    // Animate the slots
    const slots = document.querySelectorAll('.slot');
    const spinDuration = 2000; // 2 seconds
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        
        // Update slot symbols with random values during spin
        if (progress < 1) {
            slots.forEach((slot, index) => {
                // Only update if this slot hasn't stopped yet
                if (progress < 0.3 || (progress < 0.6 && index > 0) || (progress < 0.9 && index > 1)) {
                    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                    slot.textContent = randomSymbol;
                } else if (index === 0 && progress >= 0.3) {
                    slot.textContent = slotResult[0];
                } else if (index === 1 && progress >= 0.6) {
                    slot.textContent = slotResult[1];
                } else if (index === 2 && progress >= 0.9) {
                    slot.textContent = slotResult[2];
                }
            });
            
            requestAnimationFrame(animate);
        } else {
            // Animation complete
            slots.forEach((slot, index) => {
                slot.textContent = slotResult[index];
            });
            
            // Show result
            if (winnings > 0) {
                resultElement.textContent = winMessage;
                resultElement.className = 'text-center mt-6 text-xl font-semibold min-h-8 text-green-600';
                winningsElement.textContent = `You won ${winnings} coins!`;
                
                // Add winnings to user's balance
                const user = auth.currentUser;
                if (user) {
                    updateUserBalance(user.uid, winnings);
                }
                
                // Add confetti for big wins
                if (winnings >= 50) {
                    showConfetti();
                }
            } else {
                resultElement.textContent = 'Try again!';
                resultElement.className = 'text-center mt-6 text-xl font-semibold min-h-8 text-gray-600';
            }
            
            // Re-enable spin button
            spinButton.disabled = false;
            slotSpinning = false;
        }
    }
    
    animate();
}

// Utility function to show confetti effect
function showConfetti() {
    // This is a simple confetti effect using emojis
    // For a better effect, you might want to use a library like canvas-confetti
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.position = 'fixed';
    confetti.style.top = '0';
    confetti.style.left = '0';
    confetti.style.width = '100%';
    confetti.style.height = '100%';
    confetti.style.pointerEvents = 'none';
    confetti.style.zIndex = '1000';
    
    const emojis = ['🎉', '🎊', '✨', '💰', '💎', '🪙'];
    
    for (let i = 0; i < 50; i++) {
        const emoji = document.createElement('div');
        emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        emoji.style.position = 'absolute';
        emoji.style.fontSize = Math.random() * 20 + 10 + 'px';
        emoji.style.left = Math.random() * 100 + 'vw';
        emoji.style.top = '-50px';
        emoji.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;
        emoji.style.animationDelay = Math.random() * 2 + 's';
        confetti.appendChild(emoji);
    }
    
    document.body.appendChild(confetti);
    
    // Remove confetti after animation
    setTimeout(() => {
        confetti.remove();
    }, 5000);
}

// Add confetti animation to styles
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Expose functions to global scope
window.loadGame = loadGame;
window.backToLobby = backToLobby;
window.adjustBet = adjustBet;
window.refreshHistory = refreshHistory;
