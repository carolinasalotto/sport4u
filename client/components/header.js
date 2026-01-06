

class AppHeader extends HTMLElement {
  async connectedCallback(){
    this.innerHTML = `
    <header class="app-header">
      <nav>
        <ul class="nav-chips">
            <li><a href="/index.html" class="nav-chip" data-page="index"><i data-lucide="home"></i> Home</a></li>
            <li><a href="/manage-tournaments.html" class="nav-chip" id="manage-tournaments-link" data-page="manage-tournaments"><i data-lucide="trophy"></i> Manage tournaments</a></li>
            <li><a href="/mybookings.html" class="nav-chip" id="my-bookings-link" data-page="mybookings"><i data-lucide="calendar-check"></i> My bookings</a></li>
        </ul>
        <button id="login-button" class="nav-chip"><i data-lucide="user-round"></i> Login</button>
      </nav>
    </header>
    
    `;
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Set active state based on current page
    this.setActivePage();
    
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
    
    // Make "My bookings" clickable with auth check
    const myBookingsLink = document.getElementById('my-bookings-link');
    myBookingsLink.addEventListener('click', async (e) => {
      e.preventDefault();
      const authStatus = await checkLogin();
    
      if (!authStatus.isLoggedIn) {
          window.location.href = '/login.html';
          return;
      }
      
      window.location.href = '/mybookings.html';
    });
  

   // Make "Manage tournaments" clickable with auth check
   const manageTournamentsLink = document.getElementById('manage-tournaments-link');
   manageTournamentsLink.addEventListener('click', async (e) => {
     e.preventDefault();
     const authStatus = await checkLogin();
   
     if (!authStatus.isLoggedIn) {
         window.location.href = '/login.html';
         return;
     }
     
     window.location.href = '/manage-tournaments.html';
   });
 }

  setActivePage() {
    const currentPath = window.location.pathname;
    const navChips = this.querySelectorAll('.nav-chip');
    
    navChips.forEach(chip => {
      const page = chip.getAttribute('data-page');
      const isActive = 
        (page === 'index' && (currentPath === '/' || currentPath.includes('index.html'))) ||
        (page === 'manage-tournaments' && currentPath.includes('manage-tournaments.html')) ||
        (page === 'mybookings' && currentPath.includes('mybookings.html'));
      
      if (isActive) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  updateHeaderUI(authStatus) {
    const loginButton = document.getElementById('login-button');
    if(authStatus.isLoggedIn){
      loginButton.innerHTML = '<i data-lucide="user-round"></i> Logout';
      // Re-initialize icons after updating innerHTML
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    } else {
      loginButton.innerHTML = '<i data-lucide="user-round"></i> Login';
      // Re-initialize icons after updating innerHTML
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  }

}




customElements.define('app-header', AppHeader);