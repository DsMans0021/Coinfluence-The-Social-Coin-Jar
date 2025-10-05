document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const coin = document.getElementById('coin');
    const headsBtn = document.getElementById('heads-btn');
    const tailsBtn = document.getElementById('tails-btn');
    const betAmountInput = document.getElementById('bet-amount');
    const lastResult = document.getElementById('last-result');
    const winStreak = document.getElementById('win-streak');
    const backToGames = document.getElementById('back-to-games');
    
    // Game state
    let isFlipping = false;
    let currentStreak = 0;
    
    // Initialize the game
    const initCoinFlip = () => {
        // Reset coin position
        coin.style.transform = 'rotateY(0) rotateX(0) rotateZ(0)';
        
        // Add event listeners if elements exist
        if (headsBtn && tailsBtn) {
            headsBtn.addEventListener('click', () => flipCoin('heads'));
            tailsBtn.addEventListener('click', () => flipCoin('tails'));
        }
        
        if (backToGames) {
            backToGames.addEventListener('click', () => {
                document.getElementById('coinflip-game').classList.add('hidden');
                document.getElementById('games-screen').classList.remove('hidden');
            });
        }
        
        // Load any saved streak from localStorage
        const savedStreak = localStorage.getItem('coinFlipStreak');
        if (savedStreak) {
            currentStreak = parseInt(savedStreak, 10);
            updateStreakDisplay();
        }
    };
    
    // Flip the coin
    const flipCoin = async (playerChoice) => {
        // Check if already flipping
        if (isFlipping) return;
        
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
        
        // Disable buttons during flip
        isFlipping = true;
        headsBtn.disabled = true;
        tailsBtn.disabled = true;
        
        // Generate a random result (0 or 1)
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const isWin = result === playerChoice;
        
        // Calculate winnings (2x for win, 0 for loss)
        const winnings = isWin ? betAmount * 2 : 0;
        
        // Add flip animation class
        coin.classList.add('flipping');
        
        // Wait for animation to complete (3 seconds)
        setTimeout(() => {
            // Update UI with result
            updateResultDisplay(result, isWin, winnings);
            
            // Update streak
            if (isWin) {
                currentStreak++;
            } else {
                currentStreak = 0;
            }
            updateStreakDisplay();
            
            // Save streak to localStorage
            localStorage.setItem('coinFlipStreak', currentStreak);
            
            // Update database with result
            updateGameResult(user.uid, betAmount, isWin, winnings);
            
            // Re-enable buttons after a short delay
            setTimeout(() => {
                coin.classList.remove('flipping');
                isFlipping = false;
                headsBtn.disabled = false;
                tailsBtn.disabled = false;
            }, 2000);
            
        }, 3000);
    };
    
    // Update the result display
    const updateResultDisplay = (result, isWin, winnings) => {
        if (lastResult) {
            lastResult.textContent = `${result.toUpperCase()}! ${isWin ? 'You won!' : 'You lost!'} ${isWin ? `+$${winnings}` : ''}`;
            lastResult.className = isWin ? 'win' : 'lose';
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
    initCoinFlip();
});
