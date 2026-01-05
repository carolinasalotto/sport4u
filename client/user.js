const backButton = document.getElementById('back-button');
backButton.addEventListener('click', () => {
    window.history.go(-1);
});

// Get user ID from URL
const pathParts = window.location.pathname.split('/');
const userId = pathParts[pathParts.length - 1];

// Fetch user info
async function fetchUserInfo(id) {
    try {
        const response = await fetch(`/api/users/${id}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                document.getElementById('user-info').innerHTML = '<p class="error">User not found</p>';
                return;
            }
            throw new Error('Failed to fetch user');
        }
        
        const user = await response.json();
        displayUserInfo(user);
        fetchUserTournaments(id);
    } catch (error) {
        console.error('Error fetching user:', error);
        document.getElementById('user-info').innerHTML = '<p class="error">Error loading user details</p>';
    }
}

function displayUserInfo(user) {
    const userInfoElement = document.getElementById('user-info');
    
    userInfoElement.innerHTML = `
        <div class="user-header-section">
            <h1>${user.username}</h1>
        </div>
        <div class="user-details-section">
            <div class="detail-item">
                <strong>Name:</strong>
                <span>${user.name} ${user.surname}</span>
            </div>
            <div class="detail-item">
                <strong>Email:</strong>
                <span>${user.email}</span>
            </div>
        </div>
    `;
}

// Fetch tournaments created by user
async function fetchUserTournaments(userId) {
    try {
        const response = await fetch(`/api/tournaments?created_by=${userId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch tournaments');
        }
        
        const tournaments = await response.json();
        displayUserTournaments(tournaments);
    } catch (error) {
        console.error('Error fetching tournaments:', error);
        document.getElementById('tournaments-list').innerHTML = '<p class="error">Error loading tournaments</p>';
    }
}

function displayUserTournaments(tournaments) {
    const tournamentsListElement = document.getElementById('tournaments-list');
    
    if (tournaments.length === 0) {
        tournamentsListElement.innerHTML = '<p>No tournaments created yet.</p>';
        return;
    }
    
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
                        <a href="/tournament/${tournament.id}" class="details-tournament-btn">View Details</a>
                    </div>
                </div>
            </div>
        `;
    });
    
    tournamentsListElement.innerHTML = `
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

// Initialize page
fetchUserInfo(userId);

