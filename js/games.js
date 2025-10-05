import { database } from './config.js';

// DOM Elements
const gameArea = document.getElementById('game-area');
const gameContainer = document.getElementById('game-container');
const currentGameTitle = document.getElementById('current-game-title');
const backToGames = document.getElementById('back-to-games');
const gamesGrid = document.querySelector('.games-grid');

// Game templates
const gameTemplates = {
    'coin-flip': `
        <div class="coin-flip-game">
            <div class="coin" id="coin">
                <div class="side heads">
                    <i class="fas fa-coins"></i>
                    <span>Heads</span>
                </div>
                <div class="side tails">
                    <i class="fas fa-coins"></i>
                    <span>Tails</span>
                </div>
            </div>
            <div class="bet-options">
                <button class="btn btn-bet" data-bet="heads">
                    <i class="fas fa-head-side"></i> Heads (1.9x)
                </button>
                <button class="btn btn-bet" data-bet="tails">
                    <i class="fas fa-coin"></i> Tails (1.9x)
                </button>
            </div>
            <div class="bet-amount">
                <input type="number" id="bet-amount" min="10" value="10" placeholder="Bet amount">
                <div class="quick-bets">
                    <button class="btn-chip" data-amount="10">10</button>
                    <button class="btn-chip" data-amount="50">50</button>
                    <button class="btn-chip" data-amount="100">100</button>
                    <button class="btn-chip" data-amount="500">500</button>
                    <button class="btn-chip" data-amount="1000">1000</button>
                </div>
            </div>
            <div class="game-result"></div>
        </div>
    `,
    'dice-roll': `
        <div class="dice-roll-game">
            <div class="dice-container">
                <div class="dice" id="dice">
                    ${Array(6).fill().map((_, i) => 
                        `<div class="dice-face" data-face="${i + 1}">
                            ${Array(i + 1).fill('<div class="dice-dot"></div>').join('')}
                        </div>`
                    ).join('')}
                </div>
            </div>
            <div class="bet-options">
                <div class="bet-option" data-bet="1">
                    <span>1</span>
                    <small>16.5x</small>
                </div>
                <div class="bet-option" data-bet="2-3">
                    <span>2-3</span>
                    <small>3x</small>
                </div>
                <div class="bet-option" data-bet="4-6">
                    <span>4-6</span>
                    <small>1.5x</small>
                </div>
            </div>
            <div class="bet-amount">
                <input type="number" id="bet-amount" min="10" value="10" placeholder="Bet amount">
                <div class="quick-bets">
                    <button class="btn-chip" data-amount="10">10</button>
                    <button class="btn-chip" data-amount="50">50</button>
                    <button class="btn-chip" data-amount="100">100</button>
                    <button class="btn-chip" data-amount="500">500</button>
                    <button class="btn-chip" data-amount="1000">1000</button>
                </div>
            </div>
            <div class="game-result"></div>
        </div>
    `,
    'slots': `
        <div class="slots-game">
            <div class="slots-container">
                <div class="slots-reel" id="reel1"></div>
                <div class="slots-reel" id="reel2"></div>
                <div class="slots-reel" id="reel3"></div>
            </div>
            <div class="slots-controls">
                <div class="bet-amount">
                    <input type="number" id="bet-amount" min="10" value="10" placeholder="Bet amount">
                    <div class="quick-bets">
                        <button class="btn-chip" data-amount="10">10</button>
                        <button class="btn-chip" data-amount="50">50</button>
                        <button class="btn-chip" data-amount="100">100</button>
                        <button class="btn-chip" data-amount="500">500</button>
                        <button class="btn-chip" data-amount="1000">1000</button>
                    </div>
                </div>
                <button class="btn btn-spin">
                    <i class="fas fa-spinner"></i> SPIN
                </button>
            </div>
            <div class="payouts">
                <h4>Payouts:</h4>
                <ul>
                    <li>3x 7s: <span class="payout-amount">10x</span></li>
                    <li>3x Bars: <span class="payout-amount">5x</span></li>
                    <li>3x Bells: <span class="payout-amount">3x</span></li>
                    <li>3x Cherries: <span class="payout-amount">2x</span></li>
                    <li>Any pair: <span class="payout-amount">1.5x</span></li>
                </ul>
            </div>
            <div class="game-result"></div>
        </div>
    `
};

// Game state
let currentGame = null;
let isAnimating = false;

// Initialize games
function initGames() {
    // Add click event to game cards
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', () => loadGame(card.dataset.game));
    });
    
    // Back to games button
    backToGames.addEventListener('click', () => {
        gameArea.classList.add('hidden');
        gamesGrid.classList.remove('hidden');
    });
}

// Load game
function loadGame(gameId) {
    if (isAnimating) return;
    
    currentGame = gameId;
    gameContainer.innerHTML = gameTemplates[gameId] || '<p>Game not found.</p>';
    gameArea.classList.remove('hidden');
    gamesGrid.classList.add('hidden');
    
    // Set game title
    const gameTitle = document.querySelector(`[data-game="${gameId}"] h3`).textContent;
    currentGameTitle.textContent = gameTitle;
    
    // Initialize game-specific logic
    switch(gameId) {
        case 'coin-flip':
            initCoinFlip();
            break;
        case 'dice-roll':
            initDiceRoll();
            break;
        case 'slots':
            initSlots();
            break;
    }
    
    // Add quick bet buttons functionality
    document.querySelectorAll('.btn-chip').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const amount = parseInt(btn.dataset.amount);
            document.getElementById('bet-amount').value = amount;
        });
    });
}

// Coin Flip Game
function initCoinFlip() {
    const coin = document.getElementById('coin');
    const betButtons = document.querySelectorAll('.btn-bet');
    const resultDisplay = document.querySelector('.game-result');
    
    betButtons.forEach(button => {
        button.addEventListener('click', async () => {
            if (isAnimating) return;
            
            const betAmount = parseInt(document.getElementById('bet-amount').value) || 0;
            const betType = button.dataset.bet;
            
            // Validate bet amount
            if (betAmount < 10) {
                showResult('Minimum bet is 10 coins', 'error');
                return;
            }
            
            // Check balance
            if (!(await window.authModule.hasEnoughBalance(betAmount))) {
                showResult('Not enough balance', 'error');
                return;
            }
            
            // Deduct bet amount
            await window.authModule.updateBalance(-betAmount);
            
            // Disable buttons during animation
            isAnimating = true;
            betButtons.forEach(btn => btn.disabled = true);
            
            // Flip the coin
            const flipResult = Math.random() < 0.5 ? 'heads' : 'tails';
            const isWin = flipResult === betType;
            const winAmount = isWin ? Math.floor(betAmount * 1.9) : 0;
            
            // Animate coin flip
            coin.style.animation = 'none';
            void coin.offsetWidth; // Trigger reflow
            coin.style.animation = `flip-${flipResult} 2s ease-out forwards`;
            
            // Show result after animation
            setTimeout(async () => {
                if (isWin) {
                    await window.authModule.updateBalance(winAmount);
                    showResult(`You won ${winAmount} coins!`, 'success');
                } else {
                    showResult('You lost! Try again!', 'lose');
                }
                
                // Re-enable buttons
                setTimeout(() => {
                    betButtons.forEach(btn => btn.disabled = false);
                    isAnimating = false;
                }, 1000);
            }, 2000);
        });
    });
    
    // Helper function to show result
    function showResult(message, type) {
        resultDisplay.textContent = message;
        resultDisplay.className = 'game-result';
        resultDisplay.classList.add(type);
    }
}

// Dice Roll Game
function initDiceRoll() {
    const dice = document.getElementById('dice');
    const betOptions = document.querySelectorAll('.bet-option');
    const resultDisplay = document.querySelector('.game-result');
    
    betOptions.forEach(option => {
        option.addEventListener('click', async () => {
            if (isAnimating) return;
            
            const betAmount = parseInt(document.getElementById('bet-amount').value) || 0;
            const betType = option.dataset.bet;
            
            // Validate bet amount
            if (betAmount < 10) {
                showResult('Minimum bet is 10 coins', 'error');
                return;
            }
            
            // Check balance
            if (!(await window.authModule.hasEnoughBalance(betAmount))) {
                showResult('Not enough balance', 'error');
                return;
            }
            
            // Deduct bet amount
            await window.authModule.updateBalance(-betAmount);
            
            // Disable options during animation
            isAnimating = true;
            betOptions.forEach(opt => opt.style.pointerEvents = 'none');
            
            // Roll the dice
            const rollResult = Math.floor(Math.random() * 6) + 1;
            let multiplier = 0;
            let isWin = false;
            
            // Determine win/loss
            if (betType === '1' && rollResult === 1) {
                multiplier = 16.5;
                isWin = true;
            } else if (betType === '2-3' && (rollResult === 2 || rollResult === 3)) {
                multiplier = 3;
                isWin = true;
            } else if (betType === '4-6' && rollResult >= 4) {
                multiplier = 1.5;
                isWin = true;
            }
            
            const winAmount = isWin ? Math.floor(betAmount * multiplier) : 0;
            
            // Animate dice roll
            dice.style.animation = 'none';
            void dice.offsetWidth; // Trigger reflow
            dice.style.animation = `roll-dice 2s ease-out forwards`;
            
            // Set the final dice face after animation
            setTimeout(() => {
                dice.setAttribute('data-face', rollResult);
                
                if (isWin) {
                    window.authModule.updateBalance(winAmount);
                    showResult(`You rolled ${rollResult} and won ${winAmount} coins!`, 'success');
                } else {
                    showResult(`You rolled ${rollResult}. Better luck next time!`, 'lose');
                }
                
                // Re-enable options
                setTimeout(() => {
                    betOptions.forEach(opt => opt.style.pointerEvents = 'auto');
                    isAnimating = false;
                }, 1000);
            }, 2000);
        });
    });
    
    // Helper function to show result
    function showResult(message, type) {
        resultDisplay.textContent = message;
        resultDisplay.className = 'game-result';
        resultDisplay.classList.add(type);
    }
}

// Slots Game
function initSlots() {
    const reels = [
        document.getElementById('reel1'),
        document.getElementById('reel2'),
        document.getElementById('reel3')
    ];
    
    const spinButton = document.querySelector('.btn-spin');
    const resultDisplay = document.querySelector('.game-result');
    
    // Slot symbols
    const symbols = ['🍒', '🔔', '🍊', '🍋', '🍇', '7️⃣', '🍉', '🍍'];
    
    // Initialize reels
    reels.forEach(reel => {
        // Add initial symbols to each reel
        for (let i = 0; i < 20; i++) {
            const symbol = document.createElement('div');
            symbol.className = 'slot-symbol';
            symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            reel.appendChild(symbol);
        }
    });
    
    spinButton.addEventListener('click', async () => {
        if (isAnimating) return;
        
        const betAmount = parseInt(document.getElementById('bet-amount').value) || 0;
        
        // Validate bet amount
        if (betAmount < 10) {
            showResult('Minimum bet is 10 coins', 'error');
            return;
        }
        
        // Check balance
        if (!(await window.authModule.hasEnoughBalance(betAmount))) {
            showResult('Not enough balance', 'error');
            return;
        }
        
        // Deduct bet amount
        await window.authModule.updateBalance(-betAmount);
        
        // Disable button during spin
        isAnimating = true;
        spinButton.disabled = true;
        
        // Generate random results
        const results = [
            Math.floor(Math.random() * symbols.length),
            Math.floor(Math.random() * symbols.length),
            Math.floor(Math.random() * symbols.length)
        ];
        
        // Animate each reel
        const spinPromises = reels.map((reel, index) => {
            return new Promise(resolve => {
                const spinDuration = 2000 + (index * 500); // Staggered spin
                const spins = 20 + Math.floor(Math.random() * 10); // Random number of spins
                
                // Reset position
                reel.style.transition = 'none';
                reel.style.transform = 'translateY(0)';
                
                // Force reflow
                void reel.offsetWidth;
                
                // Start spinning
                reel.style.transition = `transform ${spinDuration}ms cubic-bezier(0.1, 0, 0.2, 1)`;
                reel.style.transform = `translateY(calc(-100% + ${(spins * 100) + (results[index] * 20)}px))`;
                
                // Resolve when animation completes
                setTimeout(() => {
                    resolve(symbols[results[index]]);
                }, spinDuration);
            });
        });
        
        // Wait for all reels to stop
        Promise.all(spinPromises).then(async (finalSymbols) => {
            // Check for wins
            const winAmount = calculateWin(finalSymbols, betAmount);
            
            if (winAmount > 0) {
                await window.authModule.updateBalance(winAmount);
                showResult(`You won ${winAmount} coins!`, 'success');
            } else {
                showResult('No win this time. Try again!', 'lose');
            }
            
            // Re-enable button
            setTimeout(() => {
                spinButton.disabled = false;
                isAnimating = false;
            }, 1000);
        });
    });
    
    // Calculate win amount based on symbols
    function calculateWin(symbols, betAmount) {
        // Check for 3 of a kind
        if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
            if (symbols[0] === '7️⃣') return betAmount * 10; // 3x 7s
            if (symbols[0] === '🔔') return betAmount * 5;   // 3x Bells
            if (symbols[0] === '🍒') return betAmount * 2;   // 3x Cherries
            return betAmount * 3; // 3 of any other kind
        }
        
        // Check for any pair
        if (symbols[0] === symbols[1] || 
            symbols[1] === symbols[2] || 
            symbols[0] === symbols[2]) {
            return Math.floor(betAmount * 1.5);
        }
        
        return 0; // No win
    }
    
    // Helper function to show result
    function showResult(message, type) {
        resultDisplay.textContent = message;
        resultDisplay.className = 'game-result';
        resultDisplay.classList.add(type);
    }
}

// Initialize games when DOM is loaded
document.addEventListener('DOMContentLoaded', initGames);
