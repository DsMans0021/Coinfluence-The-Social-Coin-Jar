// Firebase configuration
const firebaseConfig = {
  FIRE_AUTH_TOKEN
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database();
const auth = firebase.auth();

// Export the database and auth references
window.db = database;
window.auth = auth;
