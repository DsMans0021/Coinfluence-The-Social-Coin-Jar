# Coin Gambler 🪙

A modern, interactive coin-themed gambling website with real-time multiplayer functionality powered by Firebase.

## Features

- 🎮 **Three Exciting Games**
  - 🪙 **Coin Flip**: Simple 50/50 chance game with 1.9x payout
  - 🎲 **Dice Roll**: Roll the dice with different betting options and payouts
  - 🎰 **Lucky Slots**: Classic 3-reel slot machine with multiple winning combinations

- 🔐 **Secure Authentication**
  - Google Sign-In integration
  - Secure user sessions
  - Protected user data

- 📊 **Real-time Stats**
  - Live balance updates
  - Game history
  - Win/loss tracking

- 🎨 **Beautiful UI/UX**
  - Responsive design
  - Smooth animations
  - Intuitive interface

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js (for local development)
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/coin-gambler.git
   cd coin-gambler
   ```

2. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Google Authentication
   - Set up a Realtime Database with the following security rules:
     ```json
     {
       "rules": {
         "users": {
           "$uid": {
             ".read": "auth != null && auth.uid === $uid",
             ".write": "auth != null && auth.uid === $uid"
           }
         }
       }
     }
     ```

3. **Configure Firebase**
   - Replace the Firebase configuration in `js/config.js` with your own:
     ```javascript
     const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_AUTH_DOMAIN",
       databaseURL: "YOUR_DATABASE_URL",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_STORAGE_BUCKET",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID",
       measurementId: "YOUR_MEASUREMENT_ID"
     };
     ```

4. **Run the application**
   - For local development, you can use a simple HTTP server:
     ```bash
     npx http-server
     ```
   - Or open `index.html` directly in your browser (Note: Some features may be limited due to CORS)

## Game Rules

### 🪙 Coin Flip
- Bet on Heads or Tails
- 1.9x payout on win
- Minimum bet: 10 coins

### 🎲 Dice Roll
- Three betting options:
  - 1 (16.5x payout)
  - 2-3 (3x payout)
  - 4-6 (1.5x payout)
- Minimum bet: 10 coins

### 🎰 Lucky Slots
- Match symbols to win:
  - 3x 7️⃣: 10x bet
  - 3x 🔔: 5x bet
  - 3x 🍒: 2x bet
  - Any pair: 1.5x bet
- Minimum bet: 10 coins

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Authentication, Realtime Database)
- **Libraries**:
  - Firebase SDK
  - Font Awesome (Icons)
  - Google Fonts

## Security

- All sensitive operations are handled through Firebase's secure authentication
- Client-side input validation
- Protected database rules to ensure users can only access their own data
- No sensitive information is stored in client-side code

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to Firebase for their amazing backend services
- Special thanks to all contributors

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

---

<div align="center">
  Made with ❤️ by DsMans0021
</div>
