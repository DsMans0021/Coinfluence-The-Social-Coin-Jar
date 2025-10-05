import { auth, database, googleProvider } from './config.js';

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
const googleLoginBtn = document.getElementById('google-login');
const googleSignupBtn = document.getElementById('google-signup');
const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');
const authTabs = document.querySelectorAll('.auth-tab');

// User data cache
let currentUser = null;

// Initialize authentication
function initAuth() {
    // Check auth state
    auth.onAuthStateChanged(handleAuthStateChanged);

    // Event listeners
    if (loginForm) loginForm.addEventListener('submit', handleEmailLogin);
    if (signupForm) signupForm.addEventListener('submit', handleEmailSignup);
    if (googleLoginBtn) googleLoginBtn.addEventListener('click', () => signInWithGoogle('login'));
    if (googleSignupBtn) googleSignupBtn.addEventListener('click', () => signInWithGoogle('signup'));
    if (showSignupLink) showSignupLink.addEventListener('click', (e) => switchAuthForm(e, 'signup'));
    if (showLoginLink) showLoginLink.addEventListener('click', (e) => switchAuthForm(e, 'login'));
    if (signOutButton) signOutButton.addEventListener('click', signOut);
    
    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchAuthForm(e, tabName);
        });
    });
}

// Handle auth state changes
function handleAuthStateChanged(user) {
    if (user) {
        // User is signed in
        currentUser = user;
        showApp();
        loadUserData(user.uid);
    } else {
        // User is signed out
        showAuth('login');
    }
}

// Handle email/password login
async function handleEmailLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');
    
    try {
        const { user } = await auth.signInWithEmailAndPassword(email, password);
        // User is now logged in, handled by onAuthStateChanged
    } catch (error) {
        console.error('Login error:', error);
        showError('login', getAuthErrorMessage(error));
    }
}

// Handle email/password signup
async function handleEmailSignup(e) {
    e.preventDefault();
    
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showError('signup', 'Passwords do not match');
        return;
    }
    
    // Validate password strength
    if (password.length < 6) {
        showError('signup', 'Password must be at least 6 characters');
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
        
        // Show success message
        showSuccess('Account created successfully!');
        
    } catch (error) {
        console.error('Signup error:', error);
        showError('signup', getAuthErrorMessage(error));
    }
}

// Sign in with Google
async function signInWithGoogle(context = 'login') {
    try {
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        
        // Check if user exists in database
        const userRef = database.ref('users/' + user.uid);
        const snapshot = await userRef.once('value');
        
        if (!snapshot.exists() && context === 'signup') {
            // Create new user in database for signup
            await createUserInDatabase(user);
        } else if (!snapshot.exists()) {
            // If user doesn't exist but trying to login, sign them out and show error
            await auth.signOut();
            showError('login', 'No account found with this Google email. Please sign up first.');
            return;
        } else {
            // Update last login time for existing users
            await userRef.update({
                lastLogin: Date.now()
            });
        }
        
    } catch (error) {
        console.error('Google auth error:', error);
        showError(context, getAuthErrorMessage(error));
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

// Switch between login and signup forms
function switchAuthForm(e, formType) {
    e.preventDefault();
    
    // Update active tab
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === formType);
    });
    
    // Show/hide forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.toggle('active', form.id === `${formType}-form`);
    });
    
    // Clear any error messages
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('show');
    });
}

// Show error message
function showError(formType, message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message show';
    errorElement.textContent = message;
    
    // Remove any existing error messages
    const existingError = document.querySelector(`#${formType}-form .error-message`);
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const form = document.getElementById(`${formType}-form`);
    if (form) {
        form.insertBefore(errorElement, form.firstChild);
    }
}

// Show success message
function showSuccess(message) {
    const successElement = document.createElement('div');
    successElement.className = 'success-message show';
    successElement.textContent = message;
    
    // Remove any existing success messages
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    // Add new success message
    const activeForm = document.querySelector('.auth-form.active');
    if (activeForm) {
        activeForm.insertBefore(successElement, activeForm.firstChild);
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
function showAuth(activeTab = 'login') {
    if (authScreen) {
        authScreen.classList.remove('hidden');
        appScreen.classList.add('hidden');
        
        // Show the requested tab
        if (activeTab === 'signup') {
            switchAuthForm({ preventDefault: () => {} }, 'signup');
        } else {
            switchAuthForm({ preventDefault: () => {} }, 'login');
        }
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
