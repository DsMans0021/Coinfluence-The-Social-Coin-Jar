# 🪙 Coin Gambler - Crypto Gambling Platform

A modern, responsive online casino platform featuring coin-themed gambling games. Built with HTML5, CSS3, JavaScript, and powered by Firebase for real-time data synchronization and user authentication.

![Coin Gambler Preview](https://i.imgur.com/example.png)  
*Screenshot of the Coin Gambler platform*

## ✨ Features

- 🎮 **Multiple Games**
  - 🪙 **Coin Flip**: Simple 50/50 chance game
  - 🎲 **Dice Roll**: Predict the dice outcome
  - 🎰 **Slots**: Classic slot machine experience

- 👤 **User System**
  - 🔐 Secure authentication with Firebase
  - 📊 Track game statistics and history
  - 💰 Virtual currency system

- 🎨 **Modern UI/UX**
  - 🎨 Sleek, dark theme with gold accents
  - 📱 Fully responsive design
  - 🚀 Smooth animations and transitions

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js (for development)
- Firebase account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/coin-gambler.git
   cd coin-gambler
   ```

2. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Email/Password authentication
   - Set up Realtime Database with the provided rules
   - Add your Firebase config to `js/config.js`

3. **Run locally**
   - Open `index.html` in your browser or use a local server:
     ```bash
     npx http-server
     ```

## 🔧 Firebase Configuration

### Database Rules
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid",
        ".validate": "newData.hasChildren(['username', 'balance', 'gamesPlayed', 'gamesWon', 'totalWon', 'totalLost'])",
        "username": { ".validate": "newData.isString() && newData.val().length >= 3 && newData.val().length <= 20" },
        "balance": { ".validate": "newData.isNumber() && newData.val() >= 0" },
        "gamesPlayed": { ".validate": "newData.isNumber() && newData.val() >= 0" },
        "gamesWon": { ".validate": "newData.isNumber() && newData.val() >= 0" },
        "totalWon": { ".validate": "newData.isNumber() && newData.val() >= 0" },
        "totalLost": { ".validate": "newData.isNumber() && newData.val() >= 0" },
        "email": { ".validate": "newData.isString() && newData.val().matches(/^[^@]+@[^@]+\\.[^@]+$/)" },
        "lastLogin": { ".validate": "newData.isNumber()" },
        "createdAt": { ".validate": "newData.isNumber()" }
      }
    }
  }
}
```

## 🎮 Available Games

### 1. Coin Flip
- Simple 50/50 chance game
- Bet on heads or tails
- 2x payout on win

### 2. Dice Roll
- Predict the outcome of a 6-sided die
- 6x payout for correct prediction
- Win streaks tracked

### 3. Slots
- Classic 3-reel slot machine
- Multiple winning combinations
- Special symbols with higher payouts

## 📱 Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Authentication, Realtime Database)
- **UI/UX**: Custom CSS with CSS Variables, Flexbox, CSS Grid
- **Animations**: CSS Transitions and Animations

## 📂 Project Structure

```
coin-gambler/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # All styles
└── js/
    ├── config.js       # Firebase configuration
    ├── auth.js         # Authentication logic
    ├── database.js     # Database operations
    ├── app.js          # Main application logic
    └── games/          # Game-specific logic
        ├── coinflip.js
        ├── dice.js
        └── slots.js
```

## 🛠 Development

### Adding a New Game
1. Create a new file in `js/games/`
2. Implement the game logic following the pattern of existing games
3. Add the game to the navigation in `app.js`
4. Style the game interface in `style.css`

### Customization
- **Colors**: Update the CSS variables in `:root`
- **Themes**: Add new theme classes in `style.css`
- **Game Rules**: Modify the game logic in respective JS files

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Firebase for the amazing backend services
- Font Awesome for the beautiful icons
- All open source libraries used in this project

## 📧 Contact

For questions or feedback, please contact [Your Email] or create an issue on GitHub.

---

<div align="center">
  Made with ❤️ by Your Name
</div>
