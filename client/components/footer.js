
class AppFooter extends HTMLElement {
  async connectedCallback(){
    this.innerHTML = `
    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3>Sport4u</h3>
          <p>Book fields, organize matches, and manage tournaments all in one platform.</p>
        </div>
        <div class="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/index.html"><i data-lucide="home"></i> Home</a></li>
            <li><a href="/fields.html"><i data-lucide="map-pin"></i> Browse Fields</a></li>
            <li><a href="/mybookings.html"><i data-lucide="calendar-check"></i> My Bookings</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Account</h4>
          <ul>
            <li><a href="/login.html"><i data-lucide="log-in"></i> Login</a></li>
            <li><a href="/register.html"><i data-lucide="user-plus"></i> Register</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} Sport4u. All rights reserved.</p>
      </div>
    </footer>
    
    `;
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

customElements.define('app-footer', AppFooter);

