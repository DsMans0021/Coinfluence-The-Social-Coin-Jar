import { auth, database } from './config.js';

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const userBalance = document.getElementById('user-balance');
const usernameElement = document.getElementById('username');
const userAvatar = document.getElementById('user-avatar');
const signOutButton = document.getElementById('sign-out');

// Auth Forms
const loginForm = document.getElementById('login-email-form');
const signupForm = document.getElementById('signup-email-form');
const forgotPasswordLink = document.querySelector('.forgot-password');

// User data cache
let currentUser = null;

// Initialize authentication
function initAuth() {
    // Check auth state
    auth.onAuthStateChanged(handleAuthStateChanged);

    // Event listeners
    if (loginForm) loginForm.addEventListener('submit', handleEmailLogin);
    if (signupForm) signupForm.addEventListener('submit', handleEmailSignup);
    if (signOutButton) signOutButton.addEventListener('click', signOut);
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }
}

// Handle auth state changes
function handleAuthStateChanged(user) {
    if (user) {
        // User is signed in
        currentUser = user;
        // If we're on the auth page, redirect to app
        if (window.location.pathname.endsWith('signup.html') || window.location.pathname.endsWith('index.html')) {
            window.location.href = 'app.html';
        } else {
            showApp();
            loadUserData(user.uid);
        }
    } else {
        // User is signed out
        if (window.location.pathname.endsWith('app.html')) {
            window.location.href = 'index.html';
        } else {
            showAuth();
        }
    }
}

// Handle email/password login
async function handleEmailLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = document.querySelector('#login-email-form button[type="submit"]');
    
    // Disable submit button during processing
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        // User is now logged in, handled by onAuthStateChanged
    } catch (error) {
        console.error('Login error:', error);
        showError(getAuthErrorMessage(error));
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
}

// Handle email/password signup
async function handleEmailSignup(e) {
    e.preventDefault();
    
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const submitBtn = document.querySelector('#signup-email-form button[type="submit"]');
    
    // Disable submit button during processing
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
        return;
    }
    
    // Validate password strength
    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
        return;
    }
    
    try {
        // Create user with email and password
        const { user } = await auth.createUserWithEmailAndPassword(email, password);
        
        // Update user profile with display name
        await user.updateProfile({
            displayName: username
        });
        
        // Create user in database
        await createUserInDatabase(user, { username });
        
        // Show success message and redirect to app
        showSuccess('Account created successfully! Redirecting...');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Signup error:', error);
        showError(getAuthErrorMessage(error));
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
    }
}

// Handle forgot password
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email')?.value;
    
    if (!email) {
        showError('Please enter your email address');
        return;
    }
    
    try {
        await auth.sendPasswordResetEmail(email);
        showSuccess('Password reset email sent. Please check your inbox.');
    } catch (error) {
        console.error('Password reset error:', error);
        showError(getAuthErrorMessage(error));
    }
}

// Create new user in database
async function createUserInDatabase(user, additionalData = {}) {
    const userData = {
        username: user.displayName || additionalData.username || 'Player' + Math.floor(Math.random() * 10000),
        email: user.email,
        balance: 1000, // Starting balance
        gamesPlayed: 0,
        gamesWon: 0,
        totalWon: 0,
        totalLost: 0,
        lastLogin: Date.now(),
        createdAt: Date.now(),
        photoURL: user.photoURL || ''
    };
    
    await database.ref('users/' + user.uid).set(userData);
    return userData;
}

// Load user data from database
function loadUserData(uid) {
    const userRef = database.ref('users/' + uid);
    
    userRef.on('value', (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
            updateUI(userData);
        }
    });
}

// Update UI with user data
function updateUI(userData) {
    if (usernameElement) {
        usernameElement.textContent = userData.username || 'Player';
    }
    
    if (userBalance) {
        userBalance.textContent = userData.balance ? userData.balance.toLocaleString() : '0';
    }
    
    if (userAvatar && userData.photoURL) {
        userAvatar.src = userData.photoURL;
        userAvatar.style.display = 'block';
    } else if (userAvatar) {
        userAvatar.style.display = 'none';
    }
}

// Sign out
async function signOut() {
    try {
        await auth.signOut();
        // Reset forms
        if (loginForm) loginForm.reset();
        if (signupForm) signupForm.reset();
    } catch (error) {
        console.error('Error signing out:', error);
    }
}

// Show error message
function showError(message) {
    // Remove any existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    // Add new error message
    const form = document.querySelector('form');
    if (form) {
        form.insertBefore(errorElement, form.firstChild);
        // Trigger reflow
        void errorElement.offsetWidth;
        errorElement.classList.add('show');
    }
}

// Show success message
function showSuccess(message) {
    // Remove any existing success messages
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    const successElement = document.createElement('div');
    successElement.className = 'success-message';
    successElement.textContent = message;
    
    // Add new success message
    const form = document.querySelector('form');
    if (form) {
        form.insertBefore(successElement, form.firstChild);
        // Trigger reflow
        void successElement.offsetWidth;
        successElement.classList.add('show');
    }
}

// Get user-friendly error message
function getAuthErrorMessage(error) {
    switch (error.code) {
        case 'auth/email-already-in-use':
            return 'This email is already in use. Please use a different email or log in.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters long.';
        case 'auth/user-not-found':
            return 'No account found with this email. Please sign up first.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/too-many-requests':
            return 'Too many failed login attempts. Please try again later.';
        case 'auth/popup-closed-by-user':
            return 'Sign in was cancelled.';
        case 'auth/account-exists-with-different-credential':
            return 'An account already exists with the same email but different sign-in credentials.';
        default:
            return error.message || 'An error occurred. Please try again.';
    }
}

// Show authentication screen
function showAuth() {
    if (authScreen) {
        authScreen.classList.remove('hidden');
        if (appScreen) appScreen.classList.add('hidden');
    }
}

// Show app screen
function showApp() {
    if (appScreen) {
        authScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
    }
}

// Update user balance
async function updateBalance(amount) {
    if (!currentUser) return 0;
    
    const userRef = database.ref('users/' + currentUser.uid);
    const snapshot = await userRef.once('value');
    const currentBalance = snapshot.val().balance || 0;
    const newBalance = Math.max(0, currentBalance + amount);
    
    await userRef.update({ balance: newBalance });
    return newBalance;
}

// Check if user has enough balance
async function hasEnoughBalance(amount) {
    if (!currentUser) return false;
    
    const userRef = database.ref('users/' + currentUser.uid + '/balance');
    const snapshot = await userRef.once('value');
    const currentBalance = snapshot.val() || 0;
    
    return currentBalance >= amount;
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', initAuth);

// Export functions
window.authModule = {
    updateBalance,
    hasEnoughBalance,
    getCurrentUser: () => currentUser,
    showAuth
};
