document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndLoadTournaments();
    
    const createBtn = document.getElementById('create-tournament-btn');
    const dialog = document.getElementById('tournament-dialog');
    const cancelBtn = document.getElementById('tournament-cancel-btn');
    const form = document.getElementById('tournament-form');

    createBtn.addEventListener('click', () => {
        dialog.classList.add('active');
    });

    cancelBtn.addEventListener('click', () => {
        dialog.classList.remove('active');
        form.reset();
    });

    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.classList.remove('active');
            form.reset();
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('tournament-name').value;
        const sport = document.getElementById('tournament-sport').value;
        const maxTeams = document.getElementById('tournament-max-teams').value;
        const startDate = document.getElementById('tournament-start-date').value;
        const description = document.getElementById('tournament-description').value;
        
        try {
            const response = await fetch('/api/tournaments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name,
                    sport,
                    maxTeams,
                    startDate,
                    description: description || null
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Tournament created:', result);
                dialog.classList.remove('active');
                form.reset();
                await loadTournaments();
            } else {
                const error = await response.json();
                console.error('Error creating tournament:', error);
                alert(error.error || 'Failed to create tournament');
            }
        } catch (error) {
            console.error('Error creating tournament:', error);
            alert('Connection error. Please try again later.');
        }
    });
});

// Check if user is logged in, redirect if not
async function checkAuthAndLoadTournaments() {
    const authStatus = await checkLogin();
    
    if (!authStatus.isLoggedIn) {
        window.location.href = '/login.html';
        return;
    }
    
    await loadTournaments();
}

// Load and display tournaments
async function loadTournaments() {
    const container = document.getElementById('your-tournaments');
    
    try {
        container.innerHTML = '<p>Loading your tournaments...</p>';
        
        const response = await fetch('/api/tournaments/mine', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login.html';
                return;
            }
            const error = await response.json();
            throw new Error(error.error || 'Failed to load tournaments');
        }
        
        const tournaments = await response.json();
        displayTournaments(tournaments);
    } catch (error) {
        console.error('Error loading tournaments:', error);
        container.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}

// Display tournaments in the UI
function displayTournaments(tournaments) {
    const container = document.getElementById('your-tournaments');
    
    if (tournaments.length === 0) {
        container.innerHTML = '<p class="no-tournaments">You haven\'t created any tournaments yet.</p>';
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
        
        tournamentsHTML += `
            <div class="tournament-card">
                <div class="tournament-header">
                    <h3>${tournament.name}</h3>
                    <span class="sport-badge">${tournament.sport}</span>
                </div>
                <div class="tournament-details">
                    <p class="tournament-date"><strong>Start Date:</strong> ${dateStr}</p>
                    <p class="tournament-teams"><strong>Max Teams:</strong> ${tournament.max_teams}</p>
                    ${tournament.description ? `<p class="tournament-description"><strong>Description:</strong> ${tournament.description}</p>` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = `
        <h2>Your Tournaments (${tournaments.length})</h2>
        <div class="tournaments-grid">
            ${tournamentsHTML}
        </div>
    `;
}

