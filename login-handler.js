// Get references to the DOM elements
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');

// Add event listener for form submission
loginForm.addEventListener('submit', function(event) {
    // Prevent the default form submission behavior (which causes a page reload)
    event.preventDefault();

    // Get the entered username and password
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    // --- VERY IMPORTANT ---
    // This is a FRONT-END ONLY demo login.
    // Credentials are NOT secure and are checked directly in the browser.
    // DO NOT use this method for any real application.
    // Real applications require server-side validation and secure password handling.
    // For demo purposes, we'll use simple hardcoded credentials.
    const validUsername = 'demo';
    const validPassword = 'password123'; // Choose any password for the demo

    // Check if the entered credentials match the demo credentials
    if (username === validUsername && password === validPassword) {
        // Login successful
        console.log('Login successful!');
        errorMessage.textContent = ''; // Clear any previous error message
        // Redirect to the success page
        window.location.href = 'success.html';
    } else {
        // Login failed
        console.log('Login failed!');
        errorMessage.textContent = 'Invalid username or password.';
        // Optional: Clear the password field for security/usability
        passwordInput.value = '';
        // Optional: Focus the username field again
        usernameInput.focus();
    }
});