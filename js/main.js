// Main application entry point
document.addEventListener('DOMContentLoaded', () => {
    // Add any global event listeners or initialization code here
    console.log('Coin Gambler application started');
    
    // Add animation styles dynamically
    addAnimationStyles();
});

// Add animation styles dynamically
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Coin Flip Animation */
        @keyframes flip-heads {
            0% { transform: rotateY(0); }
            50% { transform: rotateY(1800deg); }
            100% { transform: rotateY(1980deg); }
        }
        
        @keyframes flip-tails {
            0% { transform: rotateY(0); }
            50% { transform: rotateY(1620deg); }
            100% { transform: rotateY(1800deg); }
        }
        
        .flip-heads {
            animation: flip-heads 2s ease-out forwards;
        }
        
        .flip-tails {
            animation: flip-tails 2s ease-out forwards;
        }
        
        /* Dice Roll Animation */
        @keyframes roll-dice {
            0% { transform: rotateX(0) rotateY(0); }
            50% { transform: rotateX(720deg) rotateY(720deg); }
            100% { transform: rotateX(720deg) rotateY(720deg); }
        }
        
        /* Game Result Styles */
        .game-result {
            margin-top: 1.5rem;
            padding: 1rem;
            border-radius: var(--border-radius);
            font-weight: 500;
            text-align: center;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s ease;
        }
        
        .game-result.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        .game-result.success {
            background-color: rgba(0, 200, 83, 0.2);
            color: #00c853;
            border: 1px solid #00c853;
        }
        
        .game-result.error {
            background-color: rgba(255, 61, 0, 0.2);
            color: #ff3d00;
            border: 1px solid #ff3d00;
        }
        
        .game-result.lose {
            background-color: rgba(255, 61, 0, 0.1);
            color: #ff8a65;
            border: 1px solid #ff8a65;
        }
        
        /* Coin Flip Game */
        .coin-flip-game {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2rem;
        }
        
        .coin {
            width: 150px;
            height: 150px;
            position: relative;
            transform-style: preserve-3d;
            cursor: pointer;
            transition: transform 0.5s ease;
        }
        
        .side {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-size: 2rem;
            backface-visibility: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            background: linear-gradient(145deg, #f0c14b, #d4a742);
        }
        
        .side.tails {
            transform: rotateY(180deg);
        }
        
        .side i {
            font-size: 4rem;
            margin-bottom: 0.5rem;
        }
        
        .bet-options {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .bet-amount {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .bet-amount input {
            padding: 0.75rem 1rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: rgba(0, 0, 0, 0.2);
            color: white;
            border-radius: var(--border-radius);
            font-size: 1rem;
            width: 150px;
            text-align: center;
        }
        
        .quick-bets {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .btn-chip {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            border-radius: 20px;
            padding: 0.25rem 0.75rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .btn-chip:hover {
            background: var(--primary-color);
            color: var(--text-dark);
            transform: translateY(-2px);
        }
        
        /* Dice Roll Game */
        .dice-roll-game {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2rem;
        }
        
        .dice-container {
            perspective: 1000px;
            margin: 2rem 0;
        }
        
        .dice {
            width: 100px;
            height: 100px;
            position: relative;
            transform-style: preserve-3d;
            transform: rotateX(0) rotateY(0);
        }
        
        .dice-face {
            position: absolute;
            width: 100%;
            height: 100%;
            background: white;
            border: 2px solid var(--background-light);
            border-radius: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 2rem;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        /* Dice face positions */
        .dice[data-face="1"] { transform: rotateX(0) rotateY(0); }
        .dice[data-face="2"] { transform: rotateX(-90deg) rotateY(0); }
        .dice[data-face="3"] { transform: rotateX(0) rotateY(90deg); }
        .dice[data-face="4"] { transform: rotateX(0) rotateY(-90deg); }
        .dice[data-face="5"] { transform: rotateX(90deg) rotateY(0); }
        .dice[data-face="6"] { transform: rotateX(180deg) rotateY(0); }
        
        .dice-dot {
            width: 16px;
            height: 16px;
            background: var(--text-dark);
            border-radius: 50%;
            margin: 4px;
        }
        
        /* Slots Game */
        .slots-game {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2rem;
        }
        
        .slots-container {
            display: flex;
            gap: 10px;
            background: rgba(0, 0, 0, 0.3);
            padding: 20px;
            border-radius: 10px;
            border: 2px solid var(--primary-color);
        }
        
        .slots-reel {
            width: 80px;
            height: 240px;
            overflow: hidden;
            position: relative;
            background: white;
            border-radius: 5px;
        }
        
        .slot-symbol {
            height: 80px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 40px;
            background: white;
            border-bottom: 1px solid #eee;
        }
        
        .slots-controls {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
        }
        
        .btn-spin {
            background: var(--primary-color);
            color: var(--text-dark);
            font-weight: bold;
            font-size: 1.2rem;
            padding: 1rem 3rem;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .btn-spin:hover {
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(240, 193, 75, 0.5);
        }
        
        .btn-spin:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .payouts {
            background: rgba(0, 0, 0, 0.2);
            padding: 1rem 2rem;
            border-radius: var(--border-radius);
            width: 100%;
            max-width: 400px;
        }
        
        .payouts h4 {
            color: var(--primary-color);
            margin-bottom: 0.5rem;
            text-align: center;
        }
        
        .payouts ul {
            list-style: none;
            padding: 0;
        }
        
        .payouts li {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .payout-amount {
            color: var(--primary-color);
            font-weight: bold;
        }
    `;
    
    document.head.appendChild(style);
}
