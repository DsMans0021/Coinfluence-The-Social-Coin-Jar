// Stripe configuration
const stripe = Stripe('pk_test_51SDRVgHlvqWjQee4m3EC1bpqJTYp7kinuBCa5nW14ExRooCpPSGpnVF6Atj9PT01eHsTVzSUfSVwMsMPu6gTHLg700QWtQV0qK');

// Handle tip button click
document.getElementById('tipBtn').addEventListener('click', () => {
  showTipDialog();
});

// Show tip dialog
function showTipDialog() {
  const amount = prompt('Enter tip amount (USD):', '5.00');
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    toast('Please enter a valid amount', 2000, 'error');
    return;
  }
  
  const name = prompt('Your name (optional):', '');
  const message = prompt('Leave a message (optional):', '');
  
  // Create checkout session on the server
  createCheckoutSession(parseFloat(amount).toFixed(2), name, message)
    .then(session => {
      return stripe.redirectToCheckout({ sessionId: session.id });
    })
    .then(result => {
      if (result.error) {
        throw result.error;
      }
    })
    .catch(error => {
      console.error('Error:', error);
      toast('Failed to process payment', 3000, 'error');
    });
}

// Create checkout session using Firebase Functions
async function createCheckoutSession(amount, name, message) {
  // Show loading state
  const tipBtn = document.getElementById('tipBtn');
  const originalText = tipBtn.innerHTML;
  tipBtn.disabled = true;
  tipBtn.innerHTML = 'Processing...';
  
  try {
    // In a real app, you would call a Firebase Function or your backend
    // This is a simplified version that uses a direct Stripe Checkout session
    const response = await fetch('https://us-central1-coin-81c18.cloudfunctions.net/createStripeCheckout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        name: name || 'Anonymous',
        message: message || '',
        successUrl: `${window.location.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: window.location.href,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error; // Re-throw the error to be handled by the caller
  } finally {
    // Reset button state
    tipBtn.disabled = false;
    tipBtn.innerHTML = originalText;
  }

// Check for success redirect
function checkStatus() {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  
  if (sessionId) {
    // Show loading state
    document.body.style.cursor = 'wait';
    
    // In a real app, you would verify the payment on your backend
    // For now, we'll just show a thank you message
    const amount = parseFloat(urlParams.get('amount') || '0');
    
    if (amount > 0) {
      // Update the total coins in Firebase
      if (window.firebaseUtils) {
        window.firebaseUtils.incrementTotalCoins(amount)
          .then(() => {
            toast(`Thank you for your $${amount.toFixed(2)} tip! 🎉`, 5000, 'success');
            updateTotalCoinsDisplay();
          })
          .catch(error => {
            console.error('Error updating total coins:', error);
            toast('Thank you for your support!', 5000, 'success');
          })
          .finally(() => {
            document.body.style.cursor = 'default';
          });
      } else {
        toast('Thank you for your support!', 5000, 'success');
        document.body.style.cursor = 'default';
      }
    } else {
      toast('Thank you for your support!', 5000, 'success');
      document.body.style.cursor = 'default';
    }
    
    // Clean up the URL
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }
}

// Update the total coins display
async function updateTotalCoinsDisplay() {
  try {
    if (!window.firebaseUtils) return;
    
    const totalCoins = await window.firebaseUtils.getTotalCoins();
    const totalCoinsEl = document.getElementById('totalCoins');
    if (totalCoinsEl) {
      totalCoinsEl.textContent = `$${parseFloat(totalCoins).toFixed(2)}`;
    }
  } catch (error) {
    console.error('Error updating total coins display:', error);
  }
}

// Initialize Stripe handler
function initStripe() {
  // Check for success redirect
  checkStatus();
  
  // Update total coins display
  updateTotalCoinsDisplay();
  
  // Set up periodic refresh of total coins
  setInterval(updateTotalCoinsDisplay, 30000); // Update every 30 seconds
}

// Export functions
window.stripeHandler = {
  init: initStripe,
  updateTotalCoinsDisplay
};

// Initialize when the DOM is loaded and Firebase is ready
function initializeStripeHandler() {
  // Check if Firebase is loaded
  if (typeof firebase === 'undefined' || !window.firebaseUtils) {
    // Retry after a short delay if Firebase isn't ready
    setTimeout(initializeStripeHandler, 500);
    return;
  }
  
  // Initialize Stripe handler
  initStripe();
  
  // Add tip jar display
  addTipJarDisplay();
}

// Add tip jar display to the UI
function addTipJarDisplay() {
  // Check if the display already exists
  if (document.getElementById('tipJarDisplay')) return;
  
  // Create tip jar display
  const tipJarContainer = document.createElement('div');
  tipJarContainer.id = 'tipJarContainer';
  tipJarContainer.style.marginTop = '20px';
  tipJarContainer.style.padding = '15px';
  tipJarContainer.style.background = 'rgba(255, 255, 255, 0.05)';
  tipJarContainer.style.borderRadius = '8px';
  tipJarContainer.style.textAlign = 'center';
  
  tipJarContainer.innerHTML = `
    <h3 style="margin-top: 0; color: #f9c74f;">💝 Community Tip Jar</h3>
    <p style="margin: 10px 0;">Total collected: <strong id="totalCoins">$0.00</strong></p>
    <p style="font-size: 0.9em; color: #b9c6d6;">Help keep Coinfluence running!</p>
  `;
  
  // Add to the right column if it exists
  const rightColumn = document.querySelector('.right');
  if (rightColumn) {
    rightColumn.prepend(tipJarContainer);
    
    // Initial update of the display
    updateTotalCoinsDisplay();
    
    // Set up periodic refresh
    setInterval(updateTotalCoinsDisplay, 60000); // Update every minute
  }
}

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeStripeHandler);
} else {
  initializeStripeHandler();
}
}
