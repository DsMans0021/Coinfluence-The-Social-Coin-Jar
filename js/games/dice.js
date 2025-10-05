document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const diceElement = document.getElementById('dice');
    const rollButton = document.getElementById('roll-button');
    const betAmountInput = document.getElementById('dice-bet-amount');
    const numberSelect = document.getElementById('dice-number');
    const lastResult = document.getElementById('dice-last-result');
    const winStreak = document.getElementById('dice-win-streak');
    const backToGames = document.getElementById('dice-back-to-games');
    const diceResult = document.getElementById('dice-result');
    
    // Game state
    let isRolling = false;
    let currentStreak = 0;
    
    // Show under construction message for unused buttons
    const addUnderConstructionListeners = () => {
        const unusedButtons = [
            ...document.querySelectorAll('.btn:not(#roll-button):not(#dice-bet-amount)'),
            ...document.querySelectorAll('a[href="#"]')
        ];
        
        unusedButtons.forEach(btn => {
            if (!btn.hasAttribute('data-construction-notified')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    showMessage('This feature is under development and coming soon!', 'info');
                });
                btn.setAttribute('data-construction-notified', 'true');
            }
        });
    };
    
    // Roll the dice
    const rollDice = async () => {
        if (isRolling) return;
        
        // Validate bet amount
        const betAmount = parseFloat(betAmountInput.value);
        if (isNaN(betAmount) || betAmount <= 0) {
            showMessage('Please enter a valid bet amount', 'error');
            return;
        }
        
        const selectedNumber = parseInt(numberSelect.value, 10);
        if (isNaN(selectedNumber) || selectedNumber < 1 || selectedNumber > 6) {
            showMessage('Please select a valid number (1-6)', 'error');
            return;
        }
        
        isRolling = true;
        
        // Animate the dice roll
        const rollDuration = 2000; // 2 seconds
        const startTime = Date.now();
        
        const rollAnimation = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / rollDuration, 1);
            
            // Rotate the dice randomly during roll
            const xRot = Math.random() * 360;
            const yRot = Math.random() * 360;
            const zRot = Math.random() * 360;
            
            diceElement.style.transform = `rotateX(${xRot}deg) rotateY(${yRot}deg) rotateZ(${zRot}deg)`;
            
            if (progress < 1) {
                requestAnimationFrame(rollAnimation);
            } else {
                // Final result
                const result = Math.floor(Math.random() * 6) + 1;
                showDiceResult(result);
                isRolling = false;
                
                // Check win/loss
                const isWin = (result === selectedNumber);
                const winnings = isWin ? betAmount * 5 : 0;
                
                // Update UI
                updateResultDisplay(result, selectedNumber, isWin, winnings);
                
                // Update streak
                if (isWin) {
                    currentStreak++;
                    updateStreakDisplay();
                    localStorage.setItem('diceGameStreak', currentStreak);
                } else {
                    currentStreak = 0;
                    updateStreakDisplay();
                    localStorage.setItem('diceGameStreak', 0);
                }
                
                // Update game result in database
                if (auth.currentUser) {
                    updateGameResult(auth.currentUser.uid, betAmount, isWin, winnings);
                }
            }
        };
        
        rollAnimation();
    };
    
    // Show the final dice result
    const showDiceResult = (result) => {
        // Set the final rotation based on the result
        let xRot, yRot, zRot;
        
        // Different rotations for each face (simplified)
        switch(result) {
            case 1:
                xRot = 0; yRot = 0; zRot = 0;
                break;
            case 2:
                xRot = 0; yRot = 90; zRot = 0;
                break;
            case 3:
                xRot = 90; yRot = 0; zRot = 0;
                break;
            case 4:
                xRot = 0; yRot = 270; zRot = 0;
                break;
            case 5:
                xRot = 270; yRot = 0; zRot = 0;
                break;
            case 6:
                xRot = 180; yRot = 0; zRot = 0;
                break;
            default:
                xRot = 0; yRot = 0; zRot = 0;
        }
        
        // Add a subtle bounce effect
        diceElement.style.transition = 'transform 0.8s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
        
        // Apply the final rotation with perspective
        setTimeout(() => {
            diceElement.style.transform = `rotateX(${xRot}deg) rotateY(${yRot}deg) rotateZ(${zRot}deg)`;
        }, 50);
        
        // Reset transition after animation
        setTimeout(() => {
            diceElement.style.transition = 'transform 1s ease-out';
        }, 1000);
        
        // Update the result text
        if (diceResult) {
            diceResult.textContent = result;
        }
    };
    
    // Update the result display with enhanced visuals
    const updateResultDisplay = (result, selectedNumber, isWin, winnings) => {
        if (lastResult) {
            const resultText = isWin 
                ? `🎉 You won $${winnings.toFixed(2)}!` 
                : `😢 You lost $${parseFloat(betAmountInput.value).toFixed(2)}. Try again!`;
            
            // Animate the result text
            lastResult.textContent = '';
            lastResult.style.opacity = '0';
            lastResult.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                lastResult.textContent = resultText;
                lastResult.className = isWin ? 'win' : 'lose';
                lastResult.style.opacity = '1';
                lastResult.style.transform = 'translateY(0)';
                lastResult.style.transition = 'all 0.3s ease-out';
            }, 300);
        }
    };
    
    // Update the win streak display
    const updateStreakDisplay = () => {
        if (winStreak) {
            winStreak.textContent = `🔥 ${currentStreak}`;
            winStreak.style.display = currentStreak > 0 ? 'inline-block' : 'none';
        }
    };
    
    // Initialize the game
    const initDiceGame = () => {
        // Initialize under construction listeners
        addUnderConstructionListeners();
        
        // Create number-based dice faces
        if (diceElement) {
            // Clear existing faces
            diceElement.innerHTML = '';
            
            // Create 6 faces (1-6)
            for (let i = 1; i <= 6; i++) {
                const face = document.createElement('div');
                face.className = 'face';
                face.innerHTML = `
                    <div class="dice-face">
                        <span class="dice-number">${i}</span>
                    </div>
                `;
                face.setAttribute('data-value', i);
                diceElement.appendChild(face);
            }
            
            // Reset dice position
            diceElement.style.transform = 'rotateX(0) rotateY(0) rotateZ(0)';
        }
        
        // Add event listeners if elements exist
        if (rollButton) {
            rollButton.addEventListener('click', rollDice);
            // Add touch event for mobile
            rollButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                rollDice();
            }, { passive: false });
        }
        
        if (backToGames) {
            backToGames.addEventListener('click', () => {
                document.getElementById('dice-game').classList.add('hidden');
                document.getElementById('games-screen').classList.remove('hidden');
            });
        }
        
        // Add keyboard support for number selection
        if (numberSelect) {
            numberSelect.addEventListener('keydown', (e) => {
                if (e.key >= '1' && e.key <= '6') {
                    e.preventDefault();
                    numberSelect.value = e.key;
                }
            });
        }
        
        // Load any saved streak from localStorage
        const savedStreak = localStorage.getItem('diceGameStreak');
        if (savedStreak) {
            currentStreak = parseInt(savedStreak, 10);
            updateStreakDisplay();
        }
        
        // Initialize tooltips for mobile
        if (typeof initializeTooltips === 'function') {
            initializeTooltips();
        }
    };
    
    // Show a message to the user
    const showMessage = (message, type = 'info') => {
        // You can implement a toast notification system here
        console.log(`[${type.toUpperCase()}] ${message}`);
        alert(message); // Simple alert for now
    };
    
    // Update game result in the database
    const updateGameResult = async (userId, betAmount, isWin, winnings) => {
        try {
            // Implement your database update logic here
            // This is a placeholder for Firebase or your preferred backend
            console.log(`Updating game result for user ${userId}: ${isWin ? 'Won' : 'Lost'} $${winnings}`);
        } catch (error) {
            console.error('Error updating game result:', error);
        }
    };
    
    // Initialize the game when the page loads
    initDiceGame();
{{ ... }}
        
        // Set the final rotation based on the result
        // Each face has a different rotation to show the correct number on top
        let xRot, yRot, zRot = 0;
        
        // Add a slight tilt
        }
        
        // Add a subtle bounce effect
        diceElement.style.transition = 'transform 0.8s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
        
        // Apply the final rotation with perspective
        setTimeout(() => {
            diceElement.style.transform = `rotateX(${xRot}deg) rotateY(${yRot}deg) rotateZ(${zRot}deg)`;
        }, 50);
        
        // Reset transition after animation
        setTimeout(() => {
            diceElement.style.transition = 'transform 1s ease-out';
        }, 1000);
        
        // Update the result text with animation
        if (diceResult) {
            diceResult.textContent = result;
        }
    };
    
    // Update the result display with enhanced visuals
    const updateResultDisplay = (result, selectedNumber, isWin, winnings) => {
        if (lastResult) {
            const resultText = isWin 
                ? `🎉 You won $${winnings.toFixed(2)}!` 
                : `😢 You lost $${parseFloat(betAmountInput.value).toFixed(2)}. Try again!`;
            
            // Animate the result text
            lastResult.textContent = '';
            lastResult.style.opacity = '0';
            lastResult.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                lastResult.textContent = resultText;
                lastResult.className = isWin ? 'win' : 'lose';
                lastResult.style.opacity = '1';
                lastResult.style.transform = 'translateY(0)';
                lastResult.style.transition = 'all 0.3s ease-out';
                
                // Add confetti effect for wins
                if (isWin) {
                    triggerConfetti();
                }
            }, 300);
            
            // Update balance display with animation
            const balanceElement = document.getElementById('user-balance');
            if (balanceElement && isWin) {
                const startValue = parseFloat(balanceElement.textContent.replace(/[^0-9.-]+/g, ''));
                const endValue = startValue + winnings;
                animateValue(balanceElement, startValue, endValue, 1000);
            }
        }
    };
    
    // Animate numeric value changes
    const animateValue = (element, start, end, duration) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = `$${value.toFixed(2)}`;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };
    
    // Simple confetti effect
    const triggerConfetti = () => {
        const confettiSettings = {
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ffd700', '#ff9d00', '#ff6b00', '#ff0000']
        };
        
        // Check if confetti function is available
        if (typeof confetti === 'function') {
            confetti(confettiSettings);
        }
    };
    
    // Update the win streak display with animation
    const updateStreakDisplay = () => {
        if (winStreak) {
            // Add animation class
            winStreak.classList.add('streak-updated');
            
            // Update the text after a small delay for better visual effect
            setTimeout(() => {
                winStreak.textContent = currentStreak;
                winStreak.className = currentStreak > 0 ? 'win' : '';
                
                // Add special class for high streaks
                if (currentStreak >= 3) {
                    winStreak.classList.add('hot-streak');
                    
                    // Add fire emoji for high streaks
                    if (currentStreak >= 5) {
                        winStreak.innerHTML = `${currentStreak} 🔥`;
                    }
                } else {
                    winStreak.classList.remove('hot-streak');
                }
                
                // Remove animation class after animation completes
                setTimeout(() => {
                    winStreak.classList.remove('streak-updated');
                }, 500);
            }, 100);
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
    initDiceGame();
});
