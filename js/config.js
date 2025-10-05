// Firebase configuration
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
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// Database reference
const usersRef = database.ref('users');
const gamesRef = database.ref('games');
