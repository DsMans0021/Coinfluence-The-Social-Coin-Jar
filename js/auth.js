// DOM Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authMessage = document.getElementById('auth-message');
const tabButtons = document.querySelectorAll('.tab-btn');
const loginTab = document.querySelector('[data-tab="login"]');
const registerTab = document.querySelector('[data-tab="register"]');
const authScreen = document.getElementById('auth-screen');
const mainApp = document.getElementById('main-app');
const logoutBtn = document.getElementById('logout-btn');

// Tab switching
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all tabs
        tabButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked tab
        button.classList.add('active');
        
        // Show the corresponding form
        if (button.dataset.tab === 'login') {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        }
        
        // Clear any messages
        authMessage.textContent = '';
        authMessage.className = 'auth-message';
    });
});

// Login function
const login = (email, password) => {
    return auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in successfully
            const user = userCredential.user;
            // Update last login time
            return updateUserData(user.uid, {
                lastLogin: Date.now()
            });
        })
        .then(() => {
            // Hide auth screen and show main app
            authScreen.classList.add('hidden');
            mainApp.classList.remove('hidden');
            // Load user data
            loadUserData();
        })
        .catch((error) => {
            // Handle errors
            showAuthMessage(error.message, 'error');
            throw error;
        });
};

// Register function
const register = (email, password, username) => {
    return auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // User registered successfully
            const user = userCredential.user;
            
            // Create user data in database
            return createUserData(user.uid, {
                username: username,
                email: email,
                balance: 100, // Starting balance
                gamesPlayed: 0,
                gamesWon: 0,
                totalWon: 0,
                totalLost: 0,
                lastLogin: Date.now(),
                createdAt: Date.now()
            });
        })
        .then(() => {
            // Auto login after registration
            return login(email, document.getElementById('register-password').value);
        })
        .catch((error) => {
            // Handle errors
            showAuthMessage(error.message, 'error');
            throw error;
        });
};

// Logout function
const logout = () => {
    return auth.signOut()
        .then(() => {
            // Show auth screen and hide main app
            authScreen.classList.remove('hidden');
            mainApp.classList.add('hidden');
            // Reset forms
            loginForm.reset();
            registerForm.reset();
            // Show login tab
            loginTab.click();
        })
        .catch((error) => {
            console.error('Logout error:', error);
        });
};

// Show authentication message
const showAuthMessage = (message, type = 'error') => {
    authMessage.textContent = message;
    authMessage.className = `auth-message ${type}`;
};

// Event Listeners
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        login(email, password).catch(error => {
            // Error already handled in login function
            console.error('Login error:', error);
        });
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            showAuthMessage('Passwords do not match', 'error');
            return;
        }
        
        // Validate password strength
        if (password.length < 6) {
            showAuthMessage('Password must be at least 6 characters long', 'error');
            return;
        }
        
        register(email, password, username).catch(error => {
            // Error already handled in register function
            console.error('Registration error:', error);
        });
    });
}

// Logout button
if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

// Check authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        authScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        // Load user data
        loadUserData();
    } else {
        // User is signed out
        authScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
    }
});

// Export functions
window.authFunctions = {
    login,
    register,
    logout,
    showAuthMessage
};
