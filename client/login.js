const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');
const backButton = document.getElementById('back-button');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email_username = document.getElementById('email_username').value;
    const password = document.getElementById('password').value;

    // Hide previous error messages
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';

    try {
        // TODO: Replace with actual API endpoint
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email_username, password }),
        });

        if (response.ok) {
            // Redirect to home page
            window.location.href = '/';
        } else {
            const error = await response.json();
            showError(error.message || 'Invalid credentials. Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Connection error. Please try again later.');
    }
});

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

backButton.addEventListener('click', ()=>{
    window.history.go(-1);
})
