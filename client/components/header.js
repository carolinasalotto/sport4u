

class AppHeader extends HTMLElement {
  async connectedCallback(){
    this.innerHTML = `
    <header class="app-header">
      <nav>
        <ul>
            <li><a href="/index.html">Home</a></li>
            <li id="manage-tournaments-link">Manage tournaments</li>
            <li id="my-bookings-link">My bookings</li>
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
    
    // Make "My bookings" clickable
    const myBookingsLink = document.getElementById('my-bookings-link');
    myBookingsLink.style.cursor = 'pointer';
    myBookingsLink.addEventListener('click', async () => {

      const authStatus = await checkLogin();
    
      if (!authStatus.isLoggedIn) {
          // Redirect to login page if not authenticated
          window.location.href = '/login.html';
          return;
      }
      
        window.location.href = '/mybookings.html';
    });
  

   // Make "Manage tournaments" clickable
   const manageTournamentsLink = document.getElementById('manage-tournaments-link');
   manageTournamentsLink.style.cursor = 'pointer';
   manageTournamentsLink.addEventListener('click', async () => {

     const authStatus = await checkLogin();
   
     if (!authStatus.isLoggedIn) {
         // Redirect to login page if not authenticated
         window.location.href = '/login.html';
         return;
     }
     
       window.location.href = '/manage-tournaments.html';
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