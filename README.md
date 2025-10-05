# 🎰 The Coiner - Multi-Game Gambling Platform

A comprehensive online gambling platform featuring multiple games, user accounts, and real-time gameplay. Built with Node.js, Express, and MongoDB for the backend, with a modern frontend using HTML5, CSS3, and vanilla JavaScript.

## 🚀 Features

### 🎮 Games
- **Coin Flip**: Classic 50/50 chance game
- **Slots** (Coming Soon): Exciting slot machine gameplay
- **Blackjack** (Coming Soon): Play against the dealer
- **More Games**: Framework ready for additional games

### 👤 User Features
- **Secure Authentication**: Email/Password registration and login
- **Free Play Mode**: Continue playing even when out of money
- **Game History**: Track all your bets and results
- **User Profile**: Manage your account and view statistics
- **Leaderboard**: Compete with other players

### 🛠️ Technical Features
- **Real-time Gameplay**: Smooth animations and instant feedback
- **Responsive Design**: Works on desktop and mobile devices
- **Auto-cleanup**: Game history automatically clears after 12 hours
- **Secure**: Protected API endpoints and data validation

## 🛠️ Technologies Used

### Backend
- **Runtime**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Scheduling**: node-cron for automated tasks

### Frontend
- **UI Framework**: Tailwind CSS
- **Icons**: Font Awesome
- **Animations**: CSS3 and JavaScript
- **State Management**: Vanilla JavaScript

## 📝 Prerequisites

- Node.js (v14 or later)
- MongoDB (local or cloud instance)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- npm or yarn package manager

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/the-coiner.git
cd the-coiner
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory with the following variables:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/the-coiner
JWT_SECRET=your-secret-key-here
```

### 4. Start the Development Server
```bash
npm start
# or
yarn start
```

### 5. Open in Browser
Open `public/index.html` in your web browser or access via `http://localhost:5000` if using a local server.

## 🎮 How to Play

1. **Create an Account**
   - Click "Sign Up" and fill in your details
   - Verify your email (in a real production environment)

2. **Deposit Funds**
   - Start with $1,000 in demo money
   - Use the "Add Funds" button to get more (demo only)

3. **Choose a Game**
   - Select from available games in the dashboard
   - Place your bet and play!

4. **Free Play Mode**
   - If you run out of money, you'll automatically switch to free play mode
   - In free play, you can continue playing without real money
   - Win in free play to earn back into your real balance

## 🔧 Project Structure

```
the-coiner/
├── public/               # Frontend files
│   ├── css/              # CSS files
│   ├── js/               # JavaScript files
│   └── index.html        # Main HTML file
├── models/               # Database models
│   ├── User.js           # User model
│   └── GameHistory.js    # Game history model
├── routes/               # API routes
│   ├── auth.js           # Authentication routes
│   ├── games.js          # Game-related routes
│   └── users.js          # User-related routes
├── utils/                # Utility functions
│   └── cronJobs.js       # Scheduled tasks
├── .env                  # Environment variables
├── package.json          # Project configuration
└── server.js             # Main server file
```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ for educational purposes
- Uses Tailwind CSS for styling
- Icons by Font Awesome
