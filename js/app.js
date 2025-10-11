// When the page loads, let's get everything ready
document.addEventListener('DOMContentLoaded', () => {
    // Grab all the important buttons and elements we'll need
    const elements = {
        homeBtn: document.getElementById('home-btn'),
        gamesBtn: document.getElementById('games-btn'),
        profileBtn: document.getElementById('profile-btn'),
        playNowBtn: document.getElementById('play-now-btn'),
        depositBtn: document.getElementById('deposit-btn'),
        withdrawBtn: document.getElementById('withdraw-btn'),
        confirmBtn: document.getElementById('confirm-transaction'),
        transactionModal: document.getElementById('transaction-modal'),
        closeModalBtn: document.querySelector('.close-btn')
    };
    
    // All the different screens in our app
    const screens = {
        home: document.getElementById('home-screen'),
        games: document.getElementById('games-screen'),
        profile: document.getElementById('profile-screen'),
        coinflip: document.getElementById('coinflip-game'),
        dice: document.getElementById('dice-game'),
        slots: document.getElementById('slots-game')
    };
    
    // Keep track of where the user is in the app
    let currentScreen = 'home';
    
    // Set up the app when it first loads
    const initApp = () => {
        // Check if someone is logged in
        auth.onAuthStateChanged((user) => {
            const authScreen = document.getElementById('auth-screen');
            const mainApp = document.getElementById('main-app');
            
            if (user) {
                // Welcome back! Let's get their data ready
                authScreen.classList.add('hidden');
                mainApp.classList.remove('hidden');
                
                // Load their profile and game progress
                dbFunctions.loadUserData();
                
                // Get the games ready to play
                initGames();
            } else {
                // No one's logged in, show the login screen
                authScreen.classList.remove('hidden');
                mainApp.classList.add('hidden');
            }
        });
        
        // Set up event listeners
        setupEventListeners();
    };
    
    // Initialize games
    const initGames = () => {
        // Game cards on home screen
        const gameCards = document.querySelectorAll('.game-card');
        gameCards.forEach(card => {
            card.addEventListener('click', () => {
                const game = card.dataset.game;
                openGame(game);
            });
        });
        
        // Game options on games screen
        const gameOptions = document.querySelectorAll('.game-option');
        gameOptions.forEach(option => {
            option.addEventListener('click', () => {
                const game = option.dataset.game;
                openGame(game);
            });
        });
    };
    
    // Open a game
    const openGame = (game) => {
        // Hide all game screens
        if (homeScreen) homeScreen.classList.add('hidden');
        if (gamesScreen) gamesScreen.classList.add('hidden');
        if (profileScreen) profileScreen.classList.add('hidden');
        if (coinflipGame) coinflipGame.classList.add('hidden');
        if (diceGame) diceGame.classList.add('hidden');
        if (slotsGame) slotsGame.classList.add('hidden');
        
        // Show the selected game
        switch (game) {
            case 'coinflip':
                if (coinflipGame) {
                    coinflipGame.classList.remove('hidden');
                    currentScreen = 'coinflip';
                }
                break;
            case 'dice':
                if (diceGame) {
                    diceGame.classList.remove('hidden');
                    currentScreen = 'dice';
                }
                break;
            case 'slots':
                if (slotsGame) {
                    slotsGame.classList.remove('hidden');
                    currentScreen = 'slots';
                }
                break;
            default:
                if (homeScreen) {
                    homeScreen.classList.remove('hidden');
                    currentScreen = 'home';
                }
        }
        
        // Update active nav button
        updateActiveNavButton('games');
    };
    
    // Navigate to a screen
    const navigateTo = (screen) => {
        // Hide all screens
        if (homeScreen) homeScreen.classList.add('hidden');
        if (gamesScreen) gamesScreen.classList.add('hidden');
        if (profileScreen) profileScreen.classList.add('hidden');
        if (coinflipGame) coinflipGame.classList.add('hidden');
        if (diceGame) diceGame.classList.add('hidden');
        if (slotsGame) slotsGame.classList.add('hidden');
        
        // Show the selected screen
        switch (screen) {
            case 'home':
                if (homeScreen) homeScreen.classList.remove('hidden');
                break;
            case 'games':
                if (gamesScreen) gamesScreen.classList.remove('hidden');
                break;
            case 'profile':
                if (profileScreen) profileScreen.classList.remove('hidden');
                break;
            default:
                if (homeScreen) homeScreen.classList.remove('hidden');
        }
        
        // Update current screen
        currentScreen = screen;
        
        // Update active nav button
        updateActiveNavButton(screen);
    };
    
    // Update active navigation button
    const updateActiveNavButton = (screen) => {
        // Remove active class from all nav buttons
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to the current nav button
        let activeButton;
        switch (screen) {
            case 'home':
                activeButton = homeBtn;
                break;
            case 'games':
                activeButton = gamesBtn;
                break;
            case 'profile':
                activeButton = profileBtn;
                break;
            default:
                activeButton = homeBtn;
        }
        
        if (activeButton) {
            activeButton.classList.add('active');
        }
    };
    
    // Show transaction modal
    const showTransactionModal = (type) => {
        const modalTitle = document.getElementById('modal-title');
        const transactionAmount = document.getElementById('transaction-amount');
        const transactionMethod = document.getElementById('transaction-method');
        
        if (type === 'deposit') {
            modalTitle.textContent = 'Deposit Funds';
            transactionAmount.placeholder = 'Enter amount to deposit';
        } else {
            modalTitle.textContent = 'Withdraw Funds';
            transactionAmount.placeholder = 'Enter amount to withdraw';
        }
        
        // Store the transaction type in the confirm button
        if (confirmTransactionBtn) {
            confirmTransactionBtn.dataset.transactionType = type;
        }
        
        // Show the modal
        if (transactionModal) {
            transactionModal.classList.add('show');
            setTimeout(() => {
                transactionModal.classList.add('show');
            }, 10);
        }
    };
    
    // Handle transaction
    const handleTransaction = async (type, amount, method) => {
        const user = auth.currentUser;
        if (!user) {
            showMessage('You must be logged in to perform this action', 'error');
            return false;
        }
        
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            showMessage('Please enter a valid amount', 'error');
            return false;
        }
        
        try {
            if (type === 'deposit') {
                // For demo purposes, we'll just update the balance directly
                // In a real app, you would integrate with a payment processor here
                await dbFunctions.updateBalance(user.uid, amountNum);
                showMessage(`Successfully deposited $${amountNum.toFixed(2)}`, 'success');
            } else {
                // For withdrawals, we need to check if the user has enough balance
                const userData = await dbFunctions.getUserData(user.uid);
                if (userData.balance < amountNum) {
                    showMessage('Insufficient balance for withdrawal', 'error');
                    return false;
                }
                
                // For demo purposes, we'll just update the balance directly
                // In a real app, you would process the withdrawal through a payment processor
                await dbFunctions.updateBalance(user.uid, -amountNum);
                showMessage(`Withdrawal request of $${amountNum.toFixed(2)} has been submitted`, 'success');
            }
            
            // Reload user data to update the UI
            await dbFunctions.loadUserData();
            return true;
        } catch (error) {
            console.error('Transaction error:', error);
            showMessage('An error occurred. Please try again.', 'error');
            return false;
        }
    };
    
    // Show a message to the user
    const showMessage = (message, type = 'info') => {
        // You can implement a toast notification system here
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // For now, we'll just use an alert for errors
        if (type === 'error') {
            alert(message);
        }
    };
    
    // Set up event listeners
    const setupEventListeners = () => {
        // Navigation buttons
        if (homeBtn) {
            homeBtn.addEventListener('click', () => navigateTo('home'));
        }
        
        if (gamesBtn) {
            gamesBtn.addEventListener('click', () => navigateTo('games'));
        }
        
        if (profileBtn) {
            profileBtn.addEventListener('click', () => navigateTo('profile'));
        }
        
        // Play Now button on home screen
        if (playNowBtn) {
            playNowBtn.addEventListener('click', () => navigateTo('games'));
        }
        
        // Deposit/Withdraw buttons
        if (depositBtn) {
            depositBtn.addEventListener('click', () => showTransactionModal('deposit'));
        }
        
        if (withdrawBtn) {
            withdrawBtn.addEventListener('click', () => showTransactionModal('withdraw'));
        }
        
        // Transaction modal
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                if (transactionModal) {
                    transactionModal.classList.remove('show');
                }
            });
        }
        
        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target === transactionModal) {
                transactionModal.classList.remove('show');
            }
        });
        
        // Confirm transaction button
        if (confirmTransactionBtn) {
            confirmTransactionBtn.addEventListener('click', async () => {
                const type = confirmTransactionBtn.dataset.transactionType;
                const amount = document.getElementById('transaction-amount').value;
                const method = document.getElementById('transaction-method').value;
                
                const success = await handleTransaction(type, amount, method);
                
                if (success) {
                    // Close the modal
                    if (transactionModal) {
                        transactionModal.classList.remove('show');
                    }
                    
                    // Clear the form
                    document.getElementById('transaction-amount').value = '';
                }
            });
        }
    };
    
    // Initialize the app
    initApp();
});
