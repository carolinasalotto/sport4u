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
      </nav>
    </header>
    `;
  }
}
customElements.define('app-header', AppHeader);

