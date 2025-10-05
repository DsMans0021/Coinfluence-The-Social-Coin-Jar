// Authentication state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');
        loadUserData(user.uid);
    } else {
        // No user is signed in
        document.getElementById('authOverlay').style.display = 'flex';
        document.getElementById('app').classList.add('hidden');
        loadAuthForm('login');
    }
});

// Load authentication form
function loadAuthForm(formType) {
    const authOverlay = document.getElementById('authOverlay');
    
    if (formType === 'login') {
        authOverlay.innerHTML = `
            <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 class="text-2xl font-bold mb-6 text-center">Welcome Back!</h2>
                <form id="loginForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" id="loginEmail" required 
                               class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" id="loginPassword" required 
                               class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <button type="submit" 
                            class="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition">
                        Login
                    </button>
                    <p class="text-center text-sm text-gray-600">
                        Don't have an account? 
                        <a href="#" onclick="loadAuthForm('signup')" class="text-blue-500 hover:underline">Sign up</a>
                    </p>
                </form>
            </div>
        `;
        
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            loginUser(email, password);
        });
    } else {
        authOverlay.innerHTML = `
            <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 class="text-2xl font-bold mb-6 text-center">Create Account</h2>
                <form id="signupForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" id="signupEmail" required 
                               class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Password (min 6 characters)</label>
                        <input type="password" id="signupPassword" required minlength="6"
                               class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                        <input type="text" id="displayName" required 
                               class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <button type="submit" 
                            class="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition">
                        Sign Up
                    </button>
                    <p class="text-center text-sm text-gray-600">
                        Already have an account? 
                        <a href="#" onclick="loadAuthForm('login')" class="text-blue-500 hover:underline">Login</a>
                    </p>
                </form>
            </div>
        `;
        
        document.getElementById('signupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const displayName = document.getElementById('displayName').value;
            signupUser(email, password, displayName);
        });
    }
}

// Sign up new user
async function signupUser(email, password, displayName) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update user profile
        await user.updateProfile({
            displayName: displayName
        });
        
        // Create user in database
        await usersRef.child(user.uid).set({
            displayName: displayName,
            email: email,
            balance: 1000, // Starting balance
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            isFreePlay: false
        });
        
        showNotification('Account created successfully!', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Login user
async function loginUser(email, password) {
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showNotification('Logged in successfully!', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Logout user
function logout() {
    auth.signOut().then(() => {
        showNotification('Logged out successfully', 'success');
    }).catch((error) => {
        showNotification('Error signing out: ' + error.message, 'error');
    });
}

// Load user data
function loadUserData(userId) {
    usersRef.child(userId).on('value', (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
            document.getElementById('userBalance').textContent = userData.balance.toLocaleString();
            // Update UI based on free play status
            if (userData.isFreePlay) {
                document.getElementById('userBalance').classList.add('text-yellow-600');
                document.getElementById('userBalance').classList.remove('text-green-600');
            } else {
                document.getElementById('userBalance').classList.add('text-green-600');
                document.getElementById('userBalance').classList.remove('text-yellow-600');
            }
        }
    });
    
    // Load user's game history
    loadGameHistory(userId);
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white ${
        type === 'error' ? 'bg-red-500' : 
        type === 'success' ? 'bg-green-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}
