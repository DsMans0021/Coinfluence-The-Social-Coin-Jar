// Features Module - Handles achievements, leaderboard, and shop functionality
const Features = (() => {
    // Achievement definitions
    const ACHIEVEMENTS = [
        {
            id: 'first_win',
            name: 'First Win',
            description: 'Win your first game',
            icon: '🏆',
            progress: 0,
            target: 1,
            reward: 100,
            unlocked: false,
            hidden: false
        },
        {
            id: 'high_roller',
            name: 'High Roller',
            description: 'Win a bet of $100 or more',
            icon: '💰',
            progress: 0,
            target: 1,
            reward: 250,
            unlocked: false,
            hidden: false
        },
        {
            id: 'lucky_seven',
            name: 'Lucky Seven',
            description: 'Roll a 7 in any dice game',
            icon: '🎲',
            progress: 0,
            target: 1,
            reward: 150,
            unlocked: false,
            hidden: false
        },
        {
            id: 'jackpot',
            name: 'Jackpot!',
            description: 'Win the maximum payout in any game',
            icon: '🎰',
            progress: 0,
            target: 1,
            reward: 500,
            unlocked: false,
            hidden: false
        },
        {
            id: 'veteran',
            name: 'Veteran Gambler',
            description: 'Play 100 games',
            icon: '🎖️',
            progress: 0,
            target: 100,
            reward: 1000,
            unlocked: false,
            hidden: false
        },
        {
            id: 'rich',
            name: 'Fortunes Favor',
            description: 'Reach a balance of $10,000',
            icon: '💎',
            progress: 0,
            target: 1,
            reward: 2000,
            unlocked: false,
            hidden: true
        }
    ];

    // Shop items
    const SHOP_ITEMS = {
        profile: [
            {
                id: 'avatar_gold',
                name: 'Gold Avatar',
                description: 'A shiny gold avatar frame',
                icon: '🟡',
                price: 500,
                type: 'avatar',
                value: 'gold-frame',
                rarity: 'common'
            },
            {
                id: 'avatar_diamond',
                name: 'Diamond Avatar',
                description: 'A sparkling diamond avatar frame',
                icon: '💎',
                price: 2000,
                type: 'avatar',
                value: 'diamond-frame',
                rarity: 'rare'
            },
            {
                id: 'title_legend',
                name: 'Legend Title',
                description: 'The legendary title for true champions',
                icon: '🌟',
                price: 5000,
                type: 'title',
                value: 'Legend',
                rarity: 'legendary'
            }
        ],
        powerups: [
            {
                id: 'double_xp',
                name: '2x XP Boost',
                description: 'Earn double XP for 1 hour',
                icon: '⚡',
                price: 1000,
                type: 'boost',
                duration: 3600000, // 1 hour in milliseconds
                multiplier: 2,
                rarity: 'rare'
            },
            {
                id: 'lucky_charm',
                name: 'Lucky Charm',
                description: 'Slightly increases your luck for the next 10 games',
                icon: '🍀',
                price: 750,
                type: 'boost',
                duration: 10, // 10 games
                multiplier: 1.1, // 10% better odds
                rarity: 'uncommon'
            }
        ],
        achievements: [
            {
                id: 'whale',
                name: 'Whale',
                description: 'You spend a lot of money here',
                icon: '🐋',
                price: 10000,
                type: 'achievement',
                rarity: 'legendary'
            },
            {
                id: 'early_supporter',
                name: 'Early Supporter',
                description: 'Thanks for supporting us from the beginning!',
                icon: '🚀',
                price: 5000,
                type: 'achievement',
                rarity: 'rare',
                limitedTime: true
            }
        ]
    };

    // Initialize the features module
    const init = async () => {
        // Load user data
        const user = auth.currentUser;
        if (!user) return;
        
        // Load achievements and shop data from Firebase
        await loadUserData(user.uid);
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize UI
        renderAchievements();
        renderLeaderboard();
        renderShop();
    };

    // Load user data from Firebase
    const loadUserData = async (userId) => {
        try {
            const userData = await db.ref(`users/${userId}`).once('value');
            const data = userData.val() || {};
            
            // Load unlocked achievements
            if (data.achievements) {
                ACHIEVEMENTS.forEach(ach => {
                    if (data.achievements[ach.id]) {
                        ach.unlocked = true;
                        ach.progress = data.achievements[ach.id].progress || 0;
                    }
                });
            }
            
            // Load inventory
            if (data.inventory) {
                // Process inventory items
            }
            
            return data;
        } catch (error) {
            console.error('Error loading user data:', error);
            return {};
        }
    };

    // Set up event listeners
    const setupEventListeners = () => {
        // Navigation
        document.getElementById('achievements-btn')?.addEventListener('click', showScreen('achievements'));
        document.getElementById('leaderboard-btn')?.addEventListener('click', showScreen('leaderboard'));
        document.getElementById('shop-btn')?.addEventListener('click', showScreen('shop'));
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                const container = e.target.closest('.leaderboard-tabs, .shop-tabs');
                
                // Update active tab
                container.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                // Show corresponding content
                if (container.classList.contains('leaderboard-tabs')) {
                    updateLeaderboardTab(tabId);
                } else if (container.classList.contains('shop-tabs')) {
                    updateShopTab(tabId);
                }
            });
        });
    };

    // Show a specific screen
    const showScreen = (screenId) => {
        return () => {
            // Hide all screens
            document.querySelectorAll('.screen').forEach(screen => {
                if (!screen.id.includes('-screen')) return;
                screen.classList.add('hidden');
            });
            
            // Show the selected screen
            document.getElementById(`${screenId}-screen`)?.classList.remove('hidden');
            
            // Update active nav button
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.id === `${screenId}-btn`) {
                    btn.classList.add('active');
                }
            });
            
            // Refresh data if needed
            if (screenId === 'leaderboard') {
                renderLeaderboard();
            } else if (screenId === 'achievements') {
                renderAchievements();
            } else if (screenId === 'shop') {
                renderShop();
            }
        };
    };

    // Render achievements
    const renderAchievements = () => {
        const container = document.querySelector('.achievements-grid');
        if (!container) return;
        
        container.innerHTML = ACHIEVEMENTS.map(ach => `
            <div class="achievement-card ${ach.unlocked ? '' : 'achievement-locked'}">
                <div class="achievement-icon">${ach.icon}</div>
                <div class="achievement-details">
                    <h3>${ach.name}</h3>
                    <p>${ach.description}</p>
                    ${!ach.unlocked && ach.target > 1 ? `
                        <div class="achievement-progress">
                            <div class="progress-bar" style="width: ${(ach.progress / ach.target) * 100}%"></div>
                        </div>
                        <small>${ach.progress} / ${ach.target}</small>
                    ` : ''}
                    ${ach.unlocked ? `<div class="achievement-reward">Reward: $${ach.reward}</div>` : ''}
                </div>
            </div>
        `).join('');
    };

    // Render leaderboard
    const renderLeaderboard = async (timeframe = 'all-time') => {
        const tbody = document.getElementById('leaderboard-body');
        if (!tbody) return;
        
        try {
            // Show loading state
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        <div class="loading-spinner"></div>
                        <p>Loading leaderboard data...</p>
                    </td>
                </tr>
            `;
            
            // Fetch real data from Firebase
            const leaderboardData = await fetchLeaderboardData(timeframe);
            
            if (leaderboardData.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center">
                            <i class="fas fa-trophy" style="font-size: 2rem; color: var(--primary); margin-bottom: 1rem; display: block;"></i>
                            <p>No data available yet. Be the first to play!</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Get current user ID for highlighting
            const currentUserId = auth.currentUser?.uid;
            
            // Render the leaderboard with privacy protection
            tbody.innerHTML = leaderboardData.map((user, index) => {
                const isCurrentUser = user.userId === currentUserId;
                const rowClass = isCurrentUser ? 'current-user' : '';
                const rankClass = index < 3 ? `rank-${index + 1}` : '';
                
                // Only show real data for the current user, anonymize others
                const displayName = isCurrentUser ? user.username : `Player #${index + 1}`;
                const displayAvatar = isCurrentUser ? (user.avatar || '👤') : '👤';
                const netWinnings = isCurrentUser ? user.netWinnings : Math.floor(user.netWinnings / 1000) * 1000; // Round to nearest 1000 for others
                const gamesWon = isCurrentUser ? user.gamesWon : Math.round(user.gamesWon / 5) * 5; // Round to nearest 5 for others
                
                return `
                    <tr class="${rowClass}" ${isCurrentUser ? `data-user-id="${user.userId}"` : ''}>
                        <td class="rank ${rankClass}">
                            ${index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                        </td>
                        <td class="user">
                            <div class="user-avatar">${displayAvatar}</div>
                            <div class="user-info">
                                <span class="username">${displayName}</span>
                                ${isCurrentUser ? '<span class="you-badge">You</span>' : ''}
                            </div>
                        </td>
                        <td class="net-winnings ${netWinnings >= 0 ? 'positive' : 'negative'}">
                            $${Math.abs(netWinnings).toLocaleString()}${!isCurrentUser ? '+' : ''}
                        </td>
                        <td class="games-won">${gamesWon}${!isCurrentUser ? '+' : ''}</td>
                    </tr>
                `;
            }).join('');
            
            // Add click handler for user rows
            tbody.querySelectorAll('tr[data-user-id]').forEach(row => {
                row.addEventListener('click', () => {
                    const userId = row.dataset.userId;
                    if (userId !== currentUserId) {
                        showUserProfile(userId);
                    }
                });
            });
            
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Failed to load leaderboard. Please try again later.</p>
                    </td>
                </tr>
            `;
        }
    };

    // Fetch leaderboard data from Firebase
    const fetchLeaderboardData = async (timeframe) => {
        try {
            // Get the current timestamp
            const now = Date.now();
            let startTime = 0; // All time by default
            
            // Calculate start time based on timeframe
            if (timeframe === 'weekly') {
                startTime = now - (7 * 24 * 60 * 60 * 1000); // 7 days ago
            } else if (timeframe === 'daily') {
                startTime = now - (24 * 60 * 60 * 1000); // 24 hours ago
            }
            
            // Get only necessary user data for the leaderboard
            const usersSnapshot = await db.ref('users').orderByChild('lastActive').limitToLast(1000).once('value');
            const users = usersSnapshot.val() || {};
            
            // Process user data with privacy in mind
            const leaderboardData = [];
            const currentUserId = auth.currentUser?.uid;
            
            for (const userId in users) {
                const user = users[userId];
                // Skip users without a username or with private profile setting
                if (!user.username || (user.privacySettings?.hideFromLeaderboard && userId !== currentUserId)) {
                    continue;
                }
                
                // Calculate net winnings based on timeframe
                let netWinnings = 0;
                
                // If we have game history and want to filter by timeframe
                if (user.gameHistory) {
                    netWinnings = Object.values(user.gameHistory)
                        .filter(game => timeframe === 'all-time' || game.timestamp > startTime)
                        .reduce((total, game) => total + (game.winAmount || 0) - (game.betAmount || 0), 0);
                } else {
                    // Fallback to total balance if no game history
                    netWinnings = user.balance || 0;
                }
                
                // Count games won in the selected timeframe
                const gamesWon = user.gameHistory 
                    ? Object.values(user.gameHistory)
                        .filter(game => game.winAmount > 0 && 
                                     (timeframe === 'all-time' || game.timestamp > startTime))
                        .length 
                    : 0;
                
                leaderboardData.push({
                    userId,
                    username: user.username,
                    netWinnings,
                    gamesWon,
                    avatar: user.avatar || '👤',
                    lastActive: user.lastActive || 0
                });
            }
            
            // Sort by net winnings (descending)
            return leaderboardData.sort((a, b) => b.netWinnings - a.netWinnings).slice(0, 100);
            
        } catch (error) {
            console.error('Error fetching leaderboard data:', error);
            return [];
        }
    };

    // Update leaderboard tab
    const updateLeaderboardTab = (tabId) => {
        // Show loading state
        const tbody = document.getElementById('leaderboard-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        <div class="loading-spinner"></div>
                        <p>Loading leaderboard data...</p>
                    </td>
                </tr>
            `;
        }
        
        // Update the active tab indicator
        document.querySelectorAll('.leaderboard-tabs .tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Load the data for the selected timeframe
        renderLeaderboard(tabId);
    };

    // Render shop
    const renderShop = () => {
        // Render profile items
        renderShopCategory('profile');
        
        // Set default tab to profile
        updateShopTab('profile');
    };

    // Render shop category
    const renderShopCategory = (category) => {
        const container = document.querySelector(`.shop-category[data-category="${category}"] .shop-items`);
        if (!container) return;
        
        const items = SHOP_ITEMS[category] || [];
        
        container.innerHTML = items.map(item => `
            <div class="shop-item" data-item-id="${item.id}">
                ${item.owned ? '<span class="shop-item-owned">Owned</span>' : ''}
                <div class="shop-item-header">
                    <div class="shop-item-icon">${item.icon}</div>
                    <h3 class="shop-item-title">${item.name}</h3>
                </div>
                <p class="shop-item-description">${item.description}</p>
                <div class="shop-item-price">$${item.price.toLocaleString()}</div>
                <button class="shop-item-button" ${item.owned ? 'disabled' : ''}>
                    ${item.owned ? 'Owned' : 'Buy Now'}
                </button>
            </div>
        `).join('');
        
        // Add event listeners to buy buttons
        container.querySelectorAll('.shop-item-button:not(:disabled)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.closest('.shop-item').dataset.itemId;
                const item = items.find(i => i.id === itemId);
                if (item) {
                    buyItem(item);
                }
            });
        });
    };

    // Update shop tab
    const updateShopTab = (tabId) => {
        // Hide all categories
        document.querySelectorAll('.shop-category').forEach(cat => {
            cat.classList.add('hidden');
        });
        
        // Show selected category
        const category = document.querySelector(`.shop-category[data-category="${tabId}"]`);
        if (category) {
            category.classList.remove('hidden');
            renderShopCategory(tabId);
        }
    };

    // Buy an item from the shop
    const buyItem = async (item) => {
        const user = auth.currentUser;
        if (!user) {
            showMessage('You must be logged in to make a purchase', 'error');
            return;
        }
        
        try {
            // Check if user has enough balance
            const userRef = db.ref(`users/${user.uid}`);
            const snapshot = await userRef.once('value');
            const userData = snapshot.val() || {};
            
            if ((userData.balance || 0) < item.price) {
                showMessage('Insufficient balance', 'error');
                return;
            }
            
            // Process purchase
            const updates = {};
            updates[`users/${user.uid}/balance`] = (userData.balance || 0) - item.price;
            
            // Add to inventory or unlock achievement
            if (item.type === 'achievement') {
                updates[`users/${user.uid}/achievements/${item.id}`] = {
                    unlocked: true,
                    unlockedAt: Date.now(),
                    isSpecial: true
                };
            } else {
                updates[`users/${user.uid}/inventory/${item.id}`] = {
                    ...item,
                    purchasedAt: Date.now()
                };
            }
            
            // Update database
            await db.ref().update(updates);
            
            // Update UI
            showMessage(`Successfully purchased ${item.name}!`, 'success');
            
            // Refresh shop and user data
            renderShop();
            
        } catch (error) {
            console.error('Error purchasing item:', error);
            showMessage('Failed to complete purchase', 'error');
        }
    };

    // Update achievement progress
    const updateAchievement = async (achievementId, progress = 1) => {
        const user = auth.currentUser;
        if (!user) return;
        
        const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement || achievement.unlocked) return;
        
        // Update progress
        achievement.progress = Math.min(achievement.progress + progress, achievement.target);
        
        // Check if achievement is unlocked
        if (achievement.progress >= achievement.target) {
            achievement.unlocked = true;
            
            // Add reward to user's balance
            try {
                const userRef = db.ref(`users/${user.uid}`);
                await userRef.transaction((userData) => {
                    if (!userData) return null;
                    
                    // Update balance
                    userData.balance = (userData.balance || 0) + achievement.reward;
                    
                    // Add to achievements
                    if (!userData.achievements) userData.achievements = {};
                    userData.achievements[achievementId] = {
                        unlocked: true,
                        unlockedAt: Date.now(),
                        progress: achievement.progress
                    };
                    
                    return userData;
                });
                
                // Show achievement unlocked notification
                showAchievementUnlocked(achievement);
                
            } catch (error) {
                console.error('Error updating achievement:', error);
            }
        } else {
            // Just update progress
            try {
                await db.ref(`users/${user.uid}/achievements/${achievementId}`).set({
                    progress: achievement.progress,
                    unlocked: false
                });
            } catch (error) {
                console.error('Error updating achievement progress:', error);
            }
        }
        
        // Update UI
        renderAchievements();
    };

    // Show achievement unlocked notification
    const showAchievementUnlocked = (achievement) => {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-notification-content">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-details">
                    <h3>Achievement Unlocked!</h3>
                    <p>${achievement.name}</p>
                    <small>+$${achievement.reward} coins</small>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remove after animation
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 5000);
    };

    // Show user profile - only for current user
    const showUserProfile = async (userId) => {
        // Only show profile for the current user
        if (userId !== auth.currentUser?.uid) {
            showMessage('You can only view your own profile', 'info');
            return;
        }
        
        try {
            const userSnapshot = await db.ref(`users/${userId}`).once('value');
            const userData = userSnapshot.val();
            
            if (userData) {
                // Show a simple profile popup
                const popup = document.createElement('div');
                popup.className = 'user-profile-popup';
                popup.innerHTML = `
                    <div class="popup-content">
                        <button class="close-popup">&times;</button>
                        <div class="profile-header">
                            <div class="profile-avatar">${userData.avatar || '👤'}</div>
                            <h2>${userData.username || 'Unknown User'}</h2>
                            <p class="member-since">Member since ${new Date(userData.createdAt || 0).toLocaleDateString()}</p>
                        </div>
                        <div class="profile-stats">
                            <div class="stat">
                                <div class="stat-value">${userData.balance ? '$' + userData.balance.toLocaleString() : 'N/A'}</div>
                                <div class="stat-label">Current Balance</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">${userData.gamesPlayed || 0}</div>
                                <div class="stat-label">Games Played</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">${userData.gamesWon || 0}</div>
                                <div class="stat-label">Games Won</div>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(popup);
                
                // Add close button handler
                popup.querySelector('.close-popup').addEventListener('click', () => {
                    popup.remove();
                });
                
                // Close when clicking outside
                popup.addEventListener('click', (e) => {
                    if (e.target === popup) {
                        popup.remove();
                    }
                });
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            showMessage('Failed to load user profile', 'error');
        }
    };
    
    // Public API
    return {
        init,
        updateAchievement,
        showScreen: (screenId) => showScreen(screenId)(),
        updateLeaderboard: (timeframe) => renderLeaderboard(timeframe)
    };
})();

// Initialize features when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on a page with the main app
    if (document.getElementById('main-app')) {
        // Wait for auth to be ready
        const checkAuth = setInterval(() => {
            if (auth.currentUser) {
                clearInterval(checkAuth);
                Features.init();
            }
        }, 100);
    }
});
