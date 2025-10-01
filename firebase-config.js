// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, onValue, set, update, serverTimestamp, query, orderByChild, limitToLast, push, get } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCS3VrMBmUE2-sjfHLd445HkgLHKvmFiu4",
  authDomain: "coin-81c18.firebaseapp.com",
  databaseURL: "https://coin-81c18-default-rtdb.firebaseio.com",
  projectId: "coin-81c18",
  storageBucket: "coin-81c18.firebasestorage.app",
  messagingSenderId: "558043083775",
  appId: "1:558043083775:web:d0512fdf66a00d1f1cadca",
  measurementId: "G-E00B895D96"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Authentication state observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    console.log("User is signed in:", user.uid);
    // Update UI if element exists
    const userStatusEl = document.getElementById('userStatus');
    if (userStatusEl) {
      userStatusEl.textContent = `👤 ${user.displayName || 'Player'}`;
    }
  } else {
    // User is signed out, sign in anonymously
    signInAnonymously(auth).catch((error) => {
      console.error("Anonymous auth failed:", error);
      toast("Failed to connect to game server", 3000, 'error');
    });
  }
});

// Function to get current user ID
function getUserId() {
  return auth.currentUser?.uid;
}

// Function to get user display name
function getUserDisplayName() {
  const user = auth.currentUser;
  return user?.displayName || `Player${Math.floor(Math.random() * 10000)}`;
}

// Function to update user display name
function updateDisplayName(name) {
  const user = auth.currentUser;
  if (user) {
    return updateProfile(user, {
      displayName: name
    });
  }
  return Promise.reject("No user signed in");
}

// Function to save user score
function saveUserScore(score) {
  const userId = getUserId();
  if (!userId) return Promise.reject("User not authenticated");
  
  const userRef = ref(database, `users/${userId}`);
  const updates = {
    score: score,
    displayName: getUserDisplayName(),
    lastUpdated: serverTimestamp()
  };
  
  return update(userRef, updates);
}

// Function to get top players
function getTopPlayers(limit = 10) {
  const usersRef = ref(database, 'users');
  const topUsersQuery = query(usersRef, orderByChild('score'), limitToLast(limit));
  
  return get(topUsersQuery)
    .then((snapshot) => {
      const users = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          users.push({
            id: child.key,
            ...child.val()
          });
        });
      }
      return users.sort((a, b) => (b.score || 0) - (a.score || 0));
    });
}

// Function to get current user's rank
function getUserRank(userId) {
  const usersRef = ref(database, 'users');
  
  return get(query(usersRef, orderByChild('score')))
    .then((snapshot) => {
      const users = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          users.push({
            id: child.key,
            ...child.val()
          });
        });
      }
      
      // Sort by score descending
      users.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      // Find user's rank (1-based index)
      const rank = users.findIndex(user => user.id === userId) + 1;
      return rank > 0 ? rank : null;
    });
}

// Function to get total coins in the jar (for the tip jar total)
function getTotalCoins() {
  return get(ref(database, 'stats/totalCoins'))
    .then(snapshot => snapshot.val() || 0);
}

// Function to increment total coins (when someone adds a tip)
function incrementTotalCoins(amount) {
  const statsRef = ref(database, 'stats');
  
  return get(statsRef).then((snapshot) => {
    let stats = snapshot.val() || { totalCoins: 0 };
    stats.totalCoins = (stats.totalCoins || 0) + amount;
    return set(statsRef, stats);
  });
}

// Export functions
window.firebaseUtils = {
  getUserId,
  getUserDisplayName,
  updateDisplayName,
  saveUserScore,
  getTopPlayers,
  getUserRank,
  getTotalCoins,
  incrementTotalCoins,
  database,
  auth
};

// Helper function for toast notifications
function toast(message, duration = 3000, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, duration);
}

// Initialize anonymous authentication
signInAnonymously(auth).catch(error => {
  console.error("Anonymous auth failed:", error);
  toast("Failed to connect to game server", 3000, 'error');
});
