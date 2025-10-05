import { auth, database, googleProvider } from './config.js';

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const userBalance = document.getElementById('user-balance');
const usernameElement = document.getElementById('username');
const userAvatar = document.getElementById('user-avatar');
const signOutButton = document.getElementById('sign-out');
const googleSignInButton = document.getElementById('google-signin');

// User data cache
let currentUser = null;

// Initialize authentication
function initAuth() {
    // Check auth state
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            currentUser = user;
            showApp();
            loadUserData(user.uid);
        } else {
            // User is signed out
            showAuth();
        }
    });

    // Event listeners
    googleSignInButton.addEventListener('click', signInWithGoogle);
    signOutButton.addEventListener('click', signOut);
}

// Sign in with Google
async function signInWithGoogle() {
    try {
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        
        // Check if user exists in database
        const userRef = database.ref('users/' + user.uid);
        const snapshot = await userRef.once('value');
        
        if (!snapshot.exists()) {
            // Create new user in database
            await createUserInDatabase(user);
        } else {
            // Update last login time
            await userRef.update({
                lastLogin: Date.now()
            });
        }
        
        showApp();
    } catch (error) {
        console.error('Error signing in with Google:', error);
        alert('Failed to sign in. Please try again.');
    }
}

// Create new user in database
async function createUserInDatabase(user) {
    const userData = {
        username: user.displayName || 'Player' + Math.floor(Math.random() * 10000),
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
    usernameElement.textContent = userData.username || 'Player';
    userBalance.textContent = userData.balance.toLocaleString();
    
    if (userData.photoURL) {
        userAvatar.src = userData.photoURL;
        userAvatar.style.display = 'block';
    } else {
        userAvatar.style.display = 'none';
    }
}

// Sign out
async function signOut() {
    try {
        await auth.signOut();
        showAuth();
    } catch (error) {
        console.error('Error signing out:', error);
    }
}

// Show authentication screen
function showAuth() {
    authScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
}

// Show app screen
function showApp() {
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
}

// Update user balance
async function updateBalance(amount) {
    if (!currentUser) return;
    
    const userRef = database.ref('users/' + currentUser.uid);
    const snapshot = await userRef.once('value');
    const currentBalance = snapshot.val().balance || 0;
    const newBalance = currentBalance + amount;
    
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
    getCurrentUser: () => currentUser
};
