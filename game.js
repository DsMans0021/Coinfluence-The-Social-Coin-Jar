class CoinGame {
  constructor() {
    // DOM elements
    this.coinsContainer = document.getElementById('coins');
    this.dropBtn = document.getElementById('dropBtn');
    this.flipBtn = document.getElementById('flipBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.shareBtn = document.getElementById('shareBtn');
    this.counterEl = document.getElementById('counter');
    this.leaderboardList = document.getElementById('leaderboardList');
    this.timingDisplay = document.getElementById('timingDisplay');
    this.flipProgress = document.getElementById('flipProgress');
    this.targetZone = document.getElementById('targetZone');
    
    // Game state
    this.coins = parseInt(localStorage.getItem('cf_coins') || '0', 10);
    this.isFliping = false;
    this.animationId = null;
    this.lastUpdateTime = 0;
    this.sweetSpot = {
      start: 0.4,  // 40% of the progress bar
      end: 0.6     // 60% of the progress bar
    };
    
    // Initialize game
    this.init();
  }
  
  init() {
    // Load from URL params if present
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.has('coins')) {
      const v = parseInt(urlParams.get('coins'), 10);
      if (!isNaN(v) && v >= 0) this.coins = v;
    }
    
    // Initialize UI
    this.updateCounter();
    this.renderStack();
    this.setupEventListeners();
    
    // Initialize Firebase if available
    if (window.firebaseUtils) {
      this.initFirebase();
    } else {
      console.warn('Firebase not initialized');
    }
    
    // Start the game loop
    this.gameLoop();
  }
  
  initFirebase() {
    // Update leaderboard when it changes
    firebaseUtils.database.ref('users')
      .orderByChild('score')
      .limitToLast(10)
      .on('value', (snapshot) => {
        this.updateLeaderboard(snapshot);
      });
    
    // Update total coins display when it changes
    firebaseUtils.database.ref('stats/totalCoins')
      .on('value', (snapshot) => {
        const totalCoins = snapshot.val() || 0;
        const totalCoinsEl = document.getElementById('totalCoins');
        if (totalCoinsEl) {
          totalCoinsEl.textContent = `$${totalCoins.toFixed(2)}`;
        }
      });
  }
  
  setupEventListeners() {
    // Button click handlers
    this.dropBtn.addEventListener('click', () => this.dropCoin());
    this.flipBtn.addEventListener('click', () => this.startFlipGame());
    this.resetBtn.addEventListener('click', () => this.resetAll());
    this.shareBtn.addEventListener('click', () => this.shareLink());
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      // Space to drop/flip
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.isFliping) {
          this.checkFlipResult();
        } else {
          this.dropCoin();
        }
      }
      
      // R to reset (for testing)
      if (e.code === 'KeyR' && e.ctrlKey) {
        this.resetAll();
      }
    });
  }
  
  // Game loop for animations
  gameLoop(timestamp = 0) {
    const deltaTime = timestamp - this.lastUpdateTime;
    this.lastUpdateTime = timestamp;
    
    if (this.isFliping) {
      this.updateFlipGame(deltaTime);
    }
    
    this.animationId = requestAnimationFrame((ts) => this.gameLoop(ts));
  }
  
  // Coin management
  updateCounter() {
    this.counterEl.textContent = this.coins;
    
    // Update Firebase if available
    if (window.firebaseUtils) {
      firebaseUtils.saveUserScore(this.coins)
        .catch(error => console.error('Error saving score:', error));
    }
  }
  
  save() {
    localStorage.setItem('cf_coins', String(this.coins));
  }
  
  renderStack() {
    this.coinsContainer.innerHTML = '';
    const maxStack = Math.min(this.coins, 40);
    
    for (let i = 0; i < maxStack; i++) {
      const coin = document.createElement('div');
      coin.className = 'coin';
      
      // Random small horizontal jitter to avoid perfect stack
      const leftPct = 50 + (Math.random() - 0.5) * 18;
      coin.style.left = `${leftPct}%`;
      coin.style.bottom = `${8 + i * 10}px`;
      coin.style.transform = `rotate(${(Math.random() - 0.5) * 20}deg)`;
      
      this.coinsContainer.appendChild(coin);
    }
    
    // If too many, show a compact badge for remainder
    if (this.coins > 40) {
      const more = document.createElement('div');
      more.className = 'coin';
      more.textContent = `+${this.coins - 40}`;
      more.style.left = '50%';
      more.style.bottom = `${8 + 40 * 10}px`;
      more.style.width = '64px';
      more.style.height = '64px';
      more.style.fontSize = '14px';
      this.coinsContainer.appendChild(more);
    }
    
    this.updateCounter();
  }
  
  dropCoin() {
    const limit = 1000; // Increased limit
    if (this.coins >= limit) {
      this.toast('Max coins reached', 2000, 'error');
      return;
    }
    
    this.coins += 1;
    this.save();
    
    // Create and animate dropping coin
    const dropEl = document.createElement('div');
    dropEl.className = 'coin dropping';
    dropEl.style.left = `${50 + (Math.random() - 0.5) * 18}%`;
    dropEl.style.bottom = '220px';
    this.coinsContainer.appendChild(dropEl);
    
    // When animation ends, update the stack
    dropEl.addEventListener('animationend', () => {
      this.renderStack();
      
      // Achievement notifications
      if (this.coins === 10) this.toast('Achievement: 10 coins!', 2500, 'success');
      else if (this.coins === 50) this.toast('Achievement: 50 coins!', 2500, 'success');
      else if (this.coins === 100) this.toast('Achievement: 100 coins!', 2500, 'success');
    }, { once: true });
  }
  
  // Skill-based flip game
  startFlipGame() {
    if (this.coins <= 0) {
      this.toast('No coins to flip', 1500, 'error');
      return;
    }
    
    // Disable buttons during flip
    this.dropBtn.disabled = true;
    this.flipBtn.disabled = true;
    
    // Consume 1 coin for the bet
    this.coins -= 1;
    this.save();
    this.updateCounter();
    
    // Set up flip game state
    this.isFliping = true;
    this.flipStartTime = performance.now();
    this.flipProgress.style.width = '0%';
    this.timingDisplay.textContent = 'Wait for it...';
    this.timingDisplay.style.color = '#9fb0c6';
    
    // Randomize the sweet spot timing (between 1.5s and 3.5s)
    this.sweetSpotTime = 1500 + Math.random() * 2000;
    this.sweetSpotActive = false;
    this.alreadyChecked = false;
    
    // Show visual feedback
    this.toast('Press SPACE when the bar is in the yellow zone!', 3000, 'info');
  }
  
  updateFlipGame(deltaTime) {
    if (!this.isFliping) return;
    
    const now = performance.now();
    const elapsed = now - this.flipStartTime;
    
    // Update progress bar (0% to 100% over 5 seconds, then loop)
    const progress = (elapsed % 5000) / 5000; // 5 second loop
    this.flipProgress.style.width = `${progress * 100}%`;
    
    // Check if we're in the sweet spot time window
    const inSweetSpot = elapsed >= this.sweetSpotTime && 
                       elapsed <= this.sweetSpotTime + 500; // 500ms window
    
    // Update visual feedback
    if (inSweetSpot && !this.sweetSpotActive) {
      this.sweetSpotActive = true;
      this.timingDisplay.textContent = 'NOW! Press SPACE!';
      this.timingDisplay.style.color = '#f9c74f';
      this.flipProgress.style.background = '#f9c74f';
    } else if (!inSweetSpot && this.sweetSpotActive) {
      this.sweetSpotActive = false;
      this.timingDisplay.textContent = 'Too late! Try again...';
      this.timingDisplay.style.color = '#ef4444';
      this.flipProgress.style.background = '#ef4444';
      
      // If they didn't press in time, end the game
      if (!this.alreadyChecked) {
        this.alreadyChecked = true;
        setTimeout(() => this.endFlipGame(false), 1000);
      }
    }
  }
  
  checkFlipResult() {
    if (!this.isFliping || this.alreadyChecked) return;
    
    this.alreadyChecked = true;
    const elapsed = performance.now() - this.flipStartTime;
    const inSweetSpot = elapsed >= this.sweetSpotTime && 
                       elapsed <= this.sweetSpotTime + 500;
    
    // End the game with the result
    this.endFlipGame(inSweetSpot);
  }
  
  endFlipGame(success) {
    this.isFliping = false;
    this.dropBtn.disabled = false;
    this.flipBtn.disabled = false;
    
    if (success) {
      // Award 3 coins for a successful flip (net +2)
      this.coins += 3;
      this.save();
      this.toast('Perfect! You won 3 coins! 🎉', 2500, 'success');
      
      // Visual feedback
      this.timingDisplay.textContent = 'Perfect timing! +3 coins';
      this.timingDisplay.style.color = '#10b981';
      this.flipProgress.style.background = '#10b981';
      
      // Create visual coin
      this.createFlyingCoin();
    } else {
      // Already deducted 1 coin, just show message
      this.timingDisplay.textContent = 'Missed! Try again...';
      this.timingDisplay.style.color = '#ef4444';
      this.flipProgress.style.background = '#ef4444';
    }
    
    // Reset after a delay
    setTimeout(() => {
      this.flipProgress.style.width = '0%';
      this.timingDisplay.textContent = 'Press SPACE when the bar is in the yellow zone!';
      this.timingDisplay.style.color = '#9fb0c6';
    }, 2000);
  }
  
  createFlyingCoin() {
    const coin = document.createElement('div');
    coin.className = 'coin';
    coin.style.position = 'fixed';
    coin.style.top = '50%';
    coin.style.left = '50%';
    coin.style.transform = 'translate(-50%, -50%) scale(2)';
    coin.style.zIndex = '1000';
    coin.style.transition = 'all 1s ease-out';
    document.body.appendChild(coin);
    
    // Animate to the counter
    requestAnimationFrame(() => {
      const counterRect = this.counterEl.getBoundingClientRect();
      coin.style.top = `${counterRect.top + counterRect.height / 2}px`;
      coin.style.left = `${counterRect.left + counterRect.width / 2}px`;
      coin.style.transform = 'translate(-50%, -50%) scale(0.5)';
      coin.style.opacity = '0.5';
      
      // Remove after animation
      setTimeout(() => {
        coin.remove();
        this.renderStack(); // Update the stack with new coin count
      }, 1000);
    });
  }
  
  // Leaderboard
  updateLeaderboard(snapshot) {
    if (!snapshot.exists()) {
      this.leaderboardList.innerHTML = '<li>No players yet. Be the first!</li>';
      return;
    }
    
    const users = [];
    snapshot.forEach(child => {
      users.push({
        id: child.key,
        ...child.val()
      });
    });
    
    // Sort by score (descending)
    users.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // Update the leaderboard
    this.leaderboardList.innerHTML = '';
    const currentUserId = window.firebaseUtils ? window.firebaseUtils.getUserId() : null;
    
    users.slice(0, 10).forEach((user, index) => {
      const li = document.createElement('li');
      const isCurrentUser = user.id === currentUserId;
      
      li.innerHTML = `
        <span class="${isCurrentUser ? 'highlight' : ''}">
          ${index + 1}. ${user.displayName || 'Anonymous'}: ${user.score || 0}
          ${isCurrentUser ? ' (You!)' : ''}
        </span>
      `;
      
      this.leaderboardList.appendChild(li);
    });
    
    // Show current user's rank if not in top 10
    if (currentUserId && !users.some((u, i) => i < 10 && u.id === currentUserId)) {
      const userIndex = users.findIndex(u => u.id === currentUserId);
      if (userIndex !== -1) {
        const user = users[userIndex];
        const li = document.createElement('li');
        li.className = 'highlight';
        li.innerHTML = `...<br>${userIndex + 1}. ${user.displayName || 'You'}: ${user.score || 0} (You!)`;
        this.leaderboardList.appendChild(li);
      }
    }
  }
  
  // Other utilities
  resetAll() {
    if (!confirm('Reset your coin count to zero? This cannot be undone.')) return;
    
    this.coins = 0;
    this.save();
    this.renderStack();
    this.toast('Game reset', 2000, 'info');
  }
  
  shareLink() {
    const url = new URL(window.location.href);
    url.searchParams.set('coins', this.coins);
    
    if (navigator.share) {
      navigator.share({
        title: 'Check out my Coinfluence score!',
        text: `I have ${this.coins} coins in Coinfluence! Can you beat my score?`,
        url: url.toString()
      }).catch(console.error);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url.toString())
        .then(() => this.toast('Link copied to clipboard!', 2000, 'success'))
        .catch(() => prompt('Copy this link to share:', url.toString()));
    } else {
      prompt('Copy this link to share:', url.toString());
    }
  }
  
  toast(message, duration = 2000, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Auto-remove after duration
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// Initialize the game when the DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.coinGame = new CoinGame();
  });
} else {
  window.coinGame = new CoinGame();
}
