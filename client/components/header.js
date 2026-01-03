class AppHeader extends HTMLElement {
  connectedCallback(){
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
    const loginButton = document.getElementById('login-button');
    loginButton.addEventListener('click', ()=>{
        window.location.href = '/login.html';
    });
  

  }

}




customElements.define('app-header', AppHeader);