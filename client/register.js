const registerForm = document.getElementById('register-form');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
const backButton = document.getElementById('back-button');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const surname = document.getElementById('surname').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Hide previous messages
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
    

    // Validate passwords match
    if (password !== confirmPassword) {
        showError('Passwords do not match. Please try again.');
        return;
    }

    // Validate password length
    if (password.length < 6) {
        showError('Password must be at least 6 characters long.');
        return;
    }

    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, surname, username, email, password }),
        });

        if (response.ok) {
            console.log("success");
            window.location.href = '/';

        } else {
            const error = await response.json();
            showError(error.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('Connection error. Please try again later.');
    }
});

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}


backButton.addEventListener('click', ()=>{
    window.history.go(-2);
})

// Focus on first input when page loads
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('username').focus();
});