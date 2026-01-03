class AppHeader extends HTMLElement {
  async connectedCallback(){
    this.innerHTML = `
    <header class="app-header">
      <nav>
        <ul>
            <li>Home</li>
            <li>Find tournaments</li>
            <li>Manage tournaments</li>
            <li>My bookings</li>
        </ul>
        <button id="login-button">Login</button>
      </nav>
    </header>
    `;
    
    // Check login status and update UI
    const authStatus = await checkLogin();
    this.updateHeaderUI(authStatus);
    
    const loginButton = document.getElementById('login-button');
    loginButton.addEventListener('click', async ()=>{
        if(authStatus.isLoggedIn){
            // Logout user
            await logout();
        } else {
            // Redirect to login page
            window.location.href = '/login.html';
        }
    });
  }

  updateHeaderUI(authStatus) {
    const loginButton = document.getElementById('login-button');
    if(authStatus.isLoggedIn){
      loginButton.textContent = 'Logout';
      // You can also show user info here if needed
    } else {
      loginButton.textContent = 'Login';
    }
  }

}




customElements.define('app-header', AppHeader);