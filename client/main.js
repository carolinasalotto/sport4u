// Tab functionality
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const bookFieldsSection = document.getElementById('book-fields-section');
const tournamentsSection = document.getElementById('tournaments-section');
const usersSection = document.getElementById('users-section');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.id;
        
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        document.getElementById(targetTab + '-content').classList.add('active');
        
        // Show/hide sections
        if (targetTab === 'book-fields') {
            bookFieldsSection.classList.add('active');
            tournamentsSection.classList.remove('active');
            usersSection.classList.remove('active');
        } else if (targetTab === 'tournaments') {
            bookFieldsSection.classList.remove('active');
            tournamentsSection.classList.add('active');
            usersSection.classList.remove('active');
        } else if (targetTab === 'users') {
            bookFieldsSection.classList.remove('active');
            tournamentsSection.classList.remove('active');
            usersSection.classList.add('active');
        } else {
            bookFieldsSection.classList.remove('active');
            tournamentsSection.classList.remove('active');
            usersSection.classList.remove('active');
        }
    });
});

// Initialize book fields section visibility on page load
if (document.getElementById('book-fields').classList.contains('active')) {
    bookFieldsSection.classList.add('active');
}


// Fetch fields
async function fetchFields() {
    const response = await fetch('/api/fields?limit=6');
    const data = await response.json();
    console.log("awfwaf");
    console.log(data);
    const fieldsElement = document.getElementById('fields-row');
    data.forEach(field => {
        const fieldElement = document.createElement('div');
        fieldElement.innerHTML = `
        <img class="field-img" src="/uploads/fields/${field.id}.jpg">
        <h3>${field.name}</h3>
        `;
        fieldsElement.appendChild(fieldElement);
        fieldElement.addEventListener('click', ()=>{
            window.location.href = '/field/' + field.id;
        })
    });
}

fetchFields();

// Arrow navigation for fields row
const fieldsRow = document.getElementById('fields-row');
const scrollLeftBtn = document.getElementById('scroll-left');
const scrollRightBtn = document.getElementById('scroll-right');

function updateArrowVisibility() {
    const isScrollable = fieldsRow.scrollWidth > fieldsRow.clientWidth; // Check if the fields row is scrollable (scrollWidht=total width of the fields row, clientWidth=width of the viewport)
    scrollLeftBtn.style.display = isScrollable ? 'flex' : 'none';
    scrollRightBtn.style.display = isScrollable ? 'flex' : 'none';
    
    // Update left arrow visibility
    scrollLeftBtn.style.opacity = fieldsRow.scrollLeft > 0 ? '1' : '0';
    scrollLeftBtn.style.pointerEvents = fieldsRow.scrollLeft > 0 ? 'auto' : 'none';
    
    // Update right arrow visibility
    const isAtEnd = fieldsRow.scrollLeft + fieldsRow.clientWidth >= fieldsRow.scrollWidth - 1;
    scrollRightBtn.style.opacity = isAtEnd ? '0' : '1';
    scrollRightBtn.style.pointerEvents = isAtEnd ? 'none' : 'auto';
}

scrollLeftBtn.addEventListener('click', () => {
    fieldsRow.scrollBy({ left: -300, behavior: 'smooth' });
});

scrollRightBtn.addEventListener('click', () => {
    fieldsRow.scrollBy({ left: 300, behavior: 'smooth' });
});

fieldsRow.addEventListener('scroll', updateArrowVisibility);

// Update on window resize and after fields load
window.addEventListener('resize', updateArrowVisibility);
setTimeout(updateArrowVisibility, 100); // Initial check after fields load



document.getElementById('book-fields-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const params = new URLSearchParams();

    // Get form values by element id
    const city = document.getElementById('city').value;
    const sport = document.getElementById('sport').value;
    const date = document.getElementById('date').value;
    const hour = document.getElementById('hour').value;
    
    if (city) params.set('city', city);
    if (sport) params.set('sport', sport);
    if (date) params.set('date', date);
    if (hour) params.set('hour', hour);
    
    // Navigate to search-fields.html with params
    window.location.href = 'search-fields.html?' + params.toString();
});

// Fetch tournaments
async function fetchTournaments() {
    const tournamentsName = document.getElementById('tournaments-name').value;
    const tournamentsSport = document.getElementById('tournaments-sport').value;
    
    const params = new URLSearchParams();
    if (tournamentsName && tournamentsName.trim() !== '') {
        params.set('q', tournamentsName.trim());
    }
    if (tournamentsSport && tournamentsSport.trim() !== '') {
        params.set('sport', tournamentsSport.trim());
    }
    
    const container = document.getElementById('tournaments-container');
    container.classList.add('loading');
    container.innerHTML = '<p>Loading tournaments...</p>';
    
    try {
        const response = await fetch(`/api/tournaments?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch tournaments');
        }
        
        const tournaments = await response.json();
        displayTournaments(tournaments);
    } catch (error) {
        console.error('Error fetching tournaments:', error);
        container.innerHTML = '<p class="error">Error loading tournaments. Please try again later.</p>';
    } finally {
        container.classList.remove('loading');
    }
}

// Display tournaments in the UI
function displayTournaments(tournaments) {
    const container = document.getElementById('tournaments-container');
    
    if (tournaments.length === 0) {
        container.classList.add('empty');
        container.innerHTML = '<p>No tournaments found.</p>';
        return;
    }
    
    container.classList.remove('empty');
    let tournamentsHTML = '';
    tournaments.forEach(tournament => {
        const startDate = new Date(tournament.start_date);
        const dateStr = startDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const timeStr = startDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        tournamentsHTML += `
            <div class="tournament-card">
                <div class="tournament-header">
                    <h3>${tournament.name}</h3>
                    <span class="sport-badge">${tournament.sport}</span>
                </div>
                <div class="tournament-details">
                    <p class="tournament-date"><strong>Start Date:</strong> ${dateStr} at ${timeStr}</p>
                    <p class="tournament-teams"><strong>Max Teams:</strong> ${tournament.max_teams}</p>
                    ${tournament.description ? `<p class="tournament-description"><strong>Description:</strong> ${tournament.description}</p>` : ''}
                    <div class="tournament-actions">
                        <a href="/tournament/${tournament.id}" class="details-tournament-btn">Details</a>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = `
        <div class="tournaments-grid">
            ${tournamentsHTML}
        </div>
    `;
    
    // Make tournament cards clickable
    document.querySelectorAll('.tournament-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            // Don't navigate if clicking on links or buttons (let them handle it)
            if (e.target.closest('a') || e.target.closest('button')) {
                return;
            }
            const detailsBtn = card.querySelector('.details-tournament-btn');
            if (detailsBtn) {
                window.location.href = detailsBtn.href;
            }
        });
    });
}

// Fetch tournaments on page load
fetchTournaments();

// Listen to form changes in tournaments tab
const tournamentsNameInput = document.getElementById('tournaments-name');
const tournamentsSportSelect = document.getElementById('tournaments-sport');

let tournamentsSearchTimeout;
function debounceTournamentsSearch() {
    clearTimeout(tournamentsSearchTimeout);
    tournamentsSearchTimeout = setTimeout(() => {
        fetchTournaments();
    }, 300);
}

tournamentsNameInput.addEventListener('input', debounceTournamentsSearch);
tournamentsSportSelect.addEventListener('change', fetchTournaments);

// Fetch users
async function fetchUsers() {
    const usersName = document.getElementById('users-name').value;
    
    const params = new URLSearchParams();
    if (usersName && usersName.trim() !== '') {
        params.set('q', usersName.trim());
    }
    
    const container = document.getElementById('users-container');
    container.classList.add('loading');
    container.innerHTML = '<p>Loading users...</p>';
    
    try {
        const response = await fetch(`/api/users?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        
        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        container.innerHTML = '<p class="error">Error loading users. Please try again later.</p>';
    } finally {
        container.classList.remove('loading');
    }
}

// Display users in the UI
function displayUsers(users) {
    const container = document.getElementById('users-container');
    
    if (users.length === 0) {
        container.classList.add('empty');
        container.innerHTML = '<p>No users found.</p>';
        return;
    }
    
    container.classList.remove('empty');
    let usersHTML = '';
    users.forEach(user => {
        usersHTML += `
            <div class="user-card">
                <div class="user-header">
                    <h3>${user.username}</h3>
                </div>
                <div class="user-details">
                    <p class="user-name"><strong>Name:</strong> ${user.name} ${user.surname}</p>
                    <p class="user-email"><strong>Email:</strong> ${user.email}</p>
                    <div class="user-actions">
                        <a href="/user/${user.id}" class="details-user-btn">Details</a>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = `
        <div class="users-grid">
            ${usersHTML}
        </div>
    `;
    
    // Make user cards clickable
    document.querySelectorAll('.user-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            // Don't navigate if clicking on links or buttons (let them handle it)
            if (e.target.closest('a') || e.target.closest('button')) {
                return;
            }
            const detailsBtn = card.querySelector('.details-user-btn');
            if (detailsBtn) {
                window.location.href = detailsBtn.href;
            }
        });
    });
}

// Fetch users on page load
fetchUsers();

// Listen to form changes in users tab
const usersNameInput = document.getElementById('users-name');

let usersSearchTimeout;
function debounceUsersSearch() {
    clearTimeout(usersSearchTimeout);
    usersSearchTimeout = setTimeout(() => {
        fetchUsers();
    }, 300);
}

usersNameInput.addEventListener('input', debounceUsersSearch);