# 🎰 Gambler's Paradise - Game Library

A comprehensive online gambling platform featuring multiple games with real-money and free play options. Built with Firebase, HTML5, CSS3, and vanilla JavaScript.

## 🎮 Features

### 🔐 User Authentication
- Secure email/password signup and login
- Persistent sessions
- User profile management

### 🎲 Available Games
1. **Coin Flip**
   - Bet on heads or tails
   - Double your money on a win
   - Adjustable bet amounts

2. **Free Slots**
   - Classic 3-reel slot machine
   - Multiple winning combinations
   - Win coins without risking your balance

3. **Coming Soon**
   - Blackjack
   - Roulette
   - And more!

### 💰 Free Play Mode
- Automatic activation when balance is low
- Earn coins through free games
- Return to real-money games when balance is sufficient

### 📊 Game History
- Track all your games
- 12-hour auto-cleanup
- Win/loss statistics

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Icons**: Font Awesome
- **Backend**: Firebase
  - Authentication
  - Realtime Database
  - Hosting

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Firebase account (for deployment)

### Local Development
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/gamblers-paradise.git
   cd gamblers-paradise
   ```

2. Set up Firebase
   - Create a new Firebase project
   - Enable Email/Password authentication
   - Set up Realtime Database with the provided rules
   - Update the Firebase configuration in `js/config.js`

3. Open `index.html` in your browser

### Deployment
1. Install Firebase CLI
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase
   ```bash
   firebase login
   ```

3. Initialize and deploy
   ```bash
   firebase init
   firebase deploy
   ```

## 📱 Responsive Design
- Fully responsive layout
- Works on desktop, tablet, and mobile devices
- Touch-friendly controls

## 🔒 Security
- Client-side input validation
- Secure Firebase rules
- Protected database paths
- CSRF protection

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments
- Built with ❤️ for educational purposes
- Special thanks to Firebase for their amazing platform
- Inspired by classic casino games