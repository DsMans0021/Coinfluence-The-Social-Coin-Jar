document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const spinButton = document.getElementById('spin-button');
    const betAmountInput = document.getElementById('slots-bet-amount');
    const lastResult = document.getElementById('slots-last-result');
    const winStreak = document.getElementById('slots-win-streak');
    const backToGames = document.getElementById('slots-back-to-games');
    const reels = [
        document.getElementById('reel1'),
        document.getElementById('reel2'),
        document.getElementById('reel3')
    ];
    const reelSymbols = ['🍒', '🍊', '🍋', '🍇', '🍉', '🍎', '7️⃣', '💎'];
    
    // Game state
    let isSpinning = false;
    let currentStreak = 0;
    
    // Initialize the game
    const initSlotsGame = () => {
        // Reset reels to random symbols
        reels.forEach(reel => {
            if (reel) {
                const randomSymbol = reelSymbols[Math.floor(Math.random() * reelSymbols.length)];
                reel.textContent = randomSymbol;
            }
        });
        
        // Add event listeners if elements exist
        if (spinButton) {
            spinButton.addEventListener('click', spin);
        }
        
        if (backToGames) {
            backToGames.addEventListener('click', () => {
                document.getElementById('slots-game').classList.add('hidden');
                document.getElementById('games-screen').classList.remove('hidden');
            });
        }
        
        // Load any saved streak from localStorage
        const savedStreak = localStorage.getItem('slotsGameStreak');
        if (savedStreak) {
            currentStreak = parseInt(savedStreak, 10);
            updateStreakDisplay();
        }
    };
    
    // Spin the reels
    const spin = async () => {
        // Check if already spinning
        if (isSpinning) return;
        
        // Get bet amount
        const betAmount = parseFloat(betAmountInput.value);
        if (isNaN(betAmount) || betAmount <= 0) {
            showMessage('Please enter a valid bet amount', 'error');
            return;
        }
        
        // Check if user has enough balance
        const user = auth.currentUser;
        if (!user) {
            showMessage('You must be logged in to play', 'error');
            return;
        }
        
        const userData = await dbFunctions.getUserData(user.uid);
        if (userData.balance < betAmount) {
            showMessage('Insufficient balance', 'error');
            return;
        }
        
        // Disable button during spin
        isSpinning = true;
        spinButton.disabled = true;
        
        // Generate random results for each reel
        const results = [];
        for (let i = 0; i < reels.length; i++) {
            results.push(Math.floor(Math.random() * reelSymbols.length));
        }
        
        // Animate the reels
        animateReels(results, () => {
            // Animation complete
            const symbols = results.map(index => reelSymbols[index]);
            const isWin = checkWin(symbols);
            
            // Calculate winnings based on the result
            const winnings = isWin ? calculateWinnings(symbols, betAmount) : 0;
            
            // Update UI with result
            updateResultDisplay(symbols, isWin, winnings);
            
            // Update streak
            if (isWin) {
                currentStreak++;
            } else {
                currentStreak = 0;
            }
            updateStreakDisplay();
            
            // Save streak to localStorage
            localStorage.setItem('slotsGameStreak', currentStreak);
            
            // Update database with result
            updateGameResult(user.uid, betAmount, isWin, winnings);
            
            // Re-enable button
            isSpinning = false;
            spinButton.disabled = false;
        });
    };
    
    // Animate the reels
    const animateReels = (results, callback) => {
        const spinDuration = 2000; // 2 seconds total
        const spinInterval = 100; // Update every 100ms
        const totalUpdates = spinDuration / spinInterval;
        let updates = 0;
        
        // Store the current symbols for each reel
        const currentSymbols = reels.map((reel, index) => {
            return reel ? reel.textContent : reelSymbols[0];
        });
        
        // Start the animation
        const spinIntervalId = setInterval(() => {
            updates++;
            
            // Update each reel
            reels.forEach((reel, index) => {
                if (!reel) return;
                
                // Calculate the current position in the animation
                const progress = updates / totalUpdates;
                
                // Ease function for smooth deceleration
                const easeOut = 1 - Math.pow(1 - progress, 3);
                
                // Calculate how many symbols to rotate through
                const rotation = Math.floor(easeOut * 20) + 1; // Rotate at least once
                
                // Get a random symbol for the animation
                const randomIndex = Math.floor(Math.random() * reelSymbols.length);
                reel.textContent = reelSymbols[randomIndex];
                
                // If this is the last update, set the final symbol
                if (updates >= totalUpdates) {
                    reel.textContent = reelSymbols[results[index]];
                }
            });
            
            // Check if animation is complete
            if (updates >= totalUpdates) {
                clearInterval(spinIntervalId);
                
                // Small delay before calling the callback
                setTimeout(() => {
                    if (typeof callback === 'function') {
                        callback();
                    }
                }, 300);
            }
        }, spinInterval);
    };
    
    // Check if the spin is a win
    const checkWin = (symbols) => {
        // Check for 3 of a kind
        if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
            return true;
        }
        
        // Check for 2 of a kind (first two or last two)
        if (symbols[0] === symbols[1] || symbols[1] === symbols[2]) {
            return true;
        }
        
        return false;
    };
    
    // Calculate winnings based on the symbols
    const calculateWinnings = (symbols, betAmount) => {
        // 3 of a kind
        if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
            // Higher payouts for rarer symbols (position in the array indicates rarity)
            const symbolIndex = reelSymbols.indexOf(symbols[0]);
            const rarityMultiplier = 1 + (reelSymbols.length - symbolIndex) * 0.5;
            return Math.floor(betAmount * 5 * rarityMultiplier);
        }
        
        // 2 of a kind
        if (symbols[0] === symbols[1] || symbols[1] === symbols[2] || symbols[0] === symbols[2]) {
            return Math.floor(betAmount * 2);
        }
        
        return 0;
    };
    
    // Update the result display
    const updateResultDisplay = (symbols, isWin, winnings) => {
        if (lastResult) {
            if (isWin) {
                lastResult.textContent = `You won $${winnings}!`;
                lastResult.className = 'win';
            } else {
                lastResult.textContent = 'Try again!';
                lastResult.className = 'lose';
            }
        }
        
        // Show message with result
        showMessage(
            isWin 
                ? `Congratulations! You won $${winnings}!` 
                : `Better luck next time! You lost $${betAmountInput.value}.`,
            isWin ? 'success' : 'error'
        );
    };
    
    // Update the win streak display
    const updateStreakDisplay = () => {
        if (winStreak) {
            winStreak.textContent = currentStreak;
            winStreak.className = currentStreak > 0 ? 'win' : '';
        }
    };
    
    // Update game result in the database
    const updateGameResult = (userId, betAmount, isWin, winnings) => {
        // Calculate the net change (negative for loss, positive for win)
        const amount = isWin ? winnings - betAmount : -betAmount;
        
        dbFunctions.updateBalance(userId, amount, isWin, isWin ? 0 : betAmount)
            .then(() => {
                // Reload user data to update the UI
                return dbFunctions.loadUserData();
            })
            .catch(error => {
                console.error('Error updating game result:', error);
                showMessage('Error updating your balance. Please try again.', 'error');
            });
    };
    
    // Show a message to the user
    const showMessage = (message, type = 'info') => {
        // You can implement a toast notification system here
        console.log(`[${type.toUpperCase()}] ${message}`);
    };
    
    // Initialize the game when the page loads
    initSlotsGame();
});
