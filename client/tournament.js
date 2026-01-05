const backButton = document.getElementById('back-button');
backButton.addEventListener('click', () => {
    window.history.go(-1);
});

// Get tournament ID from URL
const pathParts = window.location.pathname.split('/');
const tournamentId = pathParts[pathParts.length - 1];

// Fetch tournament info
async function fetchTournamentInfo(id) {
    try {
        const response = await fetch(`/api/tournaments/${id}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                document.getElementById('tournament-info').innerHTML = '<p class="error">Tournament not found</p>';
                return;
            }
            throw new Error('Failed to fetch tournament');
        }
        
        const tournament = await response.json();
        
        // Check if user is logged in and is the creator
        const authStatus = await checkLogin();
        const isCreator = authStatus.isLoggedIn && authStatus.user && authStatus.user.id === tournament.created_by;
        
        displayTournamentInfo(tournament, isCreator);
    } catch (error) {
        console.error('Error fetching tournament:', error);
        document.getElementById('tournament-info').innerHTML = '<p class="error">Error loading tournament details</p>';
    }
}

function displayTournamentInfo(tournament, isCreator) {
    const tournamentInfoElement = document.getElementById('tournament-info');
    
    const startDate = new Date(tournament.start_date);
    const dateStr = startDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const createdByName = tournament.created_by_name && tournament.created_by_surname 
        ? `${tournament.created_by_name} ${tournament.created_by_surname}`
        : tournament.created_by_username || 'Unknown';
    
    tournamentInfoElement.innerHTML = `
        <div class="tournament-header-section">
            <h1>${tournament.name}</h1>
            <span class="sport-badge">${tournament.sport}</span>
        </div>
        <div class="tournament-details-section">
            <div class="detail-item">
                <strong>Start Date:</strong>
                <span>${dateStr}</span>
            </div>
            <div class="detail-item">
                <strong>Maximum Teams:</strong>
                <span>${tournament.max_teams}</span>
            </div>
            <div class="detail-item">
                <strong>Created By:</strong>
                <span>${createdByName}</span>
            </div>
            ${tournament.description ? `
            <div class="detail-item description">
                <strong>Description:</strong>
                <p>${tournament.description}</p>
            </div>
            ` : ''}
        </div>
        ${tournament.teams && tournament.teams.length > 0 ? `
        <div class="teams-section">
            <h2>Teams (${tournament.teams.length}/${tournament.max_teams})</h2>
            <div class="teams-grid">
                ${tournament.teams.map(team => `
                    <div class="team-card" data-team-id="${team.id}">
                        <div class="team-card-header">
                            <h3>${team.name}</h3>
                            ${isCreator ? `
                            <button class="delete-team-btn" data-team-id="${team.id}" data-team-name="${team.name}">Delete</button>
                            ` : ''}
                        </div>
                        <div class="players-list">
                            <strong>Players:</strong>
                            ${team.players.length > 0 ? `
                                <ul>
                                    ${team.players.map(player => `
                                        <li>#${player.jerseyNumber} - ${player.name} ${player.surname}</li>
                                    `).join('')}
                                </ul>
                            ` : '<p>No players</p>'}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : `
        <div class="teams-section">
            <h2>Teams (0/${tournament.max_teams})</h2>
            <p class="no-teams">No teams registered yet.</p>
        </div>
        `}
        ${isCreator ? `
        <div class="tournament-actions-section">
            <button id="create-team-btn" class="create-team-btn">Create Team</button>
        </div>
        ` : ''}
    `;
    
    // Attach event listener to the create team button if it exists
    const createTeamBtn = document.getElementById('create-team-btn');
    if (createTeamBtn) {
        createTeamBtn.addEventListener('click', () => {
            dialog.classList.add('active');
            // Add first player row by default
            addPlayerRow();
        });
    }
    
    // Attach event listeners to delete team buttons
    document.querySelectorAll('.delete-team-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const teamId = parseInt(btn.getAttribute('data-team-id'));
            const teamName = btn.getAttribute('data-team-name');
            deleteTeam(teamId, teamName);
        });
    });
}

// Show delete confirmation dialog
function deleteTeam(teamId, teamName) {
    // Check if dialog already exists, if not create it
    let confirmDialog = document.getElementById('confirm-delete-team-dialog');
    
    if (!confirmDialog) {
        // Create overlay
        confirmDialog = document.createElement('div');
        confirmDialog.id = 'confirm-delete-team-dialog';
        confirmDialog.className = 'dialog-overlay';
        
        // Set innerHTML with dialog structure
        confirmDialog.innerHTML = `
            <div class="dialog-modal">
                <div class="dialog-header">
                    <h3>Delete Team</h3>
                </div>
                <div class="dialog-body">
                    <p>Are you sure you want to delete this team? This action cannot be undone.</p>
                </div>
                <div class="dialog-footer">
                    <button id="dialog-cancel-team-btn" class="dialog-btn dialog-btn-secondary">No, Keep Team</button>
                    <button id="dialog-confirm-team-btn" class="dialog-btn dialog-btn-primary">Yes, Delete Team</button>
                </div>
            </div>
        `;
        
        // Attach event listeners
        const cancelBtn = confirmDialog.querySelector('#dialog-cancel-team-btn');
        const confirmBtn = confirmDialog.querySelector('#dialog-confirm-team-btn');
        
        cancelBtn.addEventListener('click', () => {
            confirmDialog.classList.remove('show');
        });
        
        confirmBtn.addEventListener('click', () => {
            const id = confirmDialog.dataset.teamId;
            if (id) {
                confirmDialog.classList.remove('show');
                performDeleteTeam(parseInt(id));
            }
        });
        
        // Close dialog when clicking outside
        confirmDialog.addEventListener('click', (e) => {
            if (e.target === confirmDialog) {
                confirmDialog.classList.remove('show');
            }
        });
        
        // Append to body
        document.body.appendChild(confirmDialog);
    }
    
    // Store team ID in dataset
    confirmDialog.dataset.teamId = teamId;
    
    // Show dialog
    confirmDialog.classList.add('show');
}

// Perform the actual deletion
async function performDeleteTeam(teamId) {
    try {
        const response = await fetch(`/api/tournaments/${tournamentId}/team/${teamId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.error || 'Failed to delete team');
            return;
        }
        
        // Reload tournament info to reflect the deletion
        await fetchTournamentInfo(tournamentId);
    } catch (error) {
        console.error('Error deleting team:', error);
        alert('Connection error. Please try again later.');
    }
}

// Load tournament info on page load
fetchTournamentInfo(tournamentId);

// Create Team Dialog functionality
const dialog = document.getElementById('create-team-dialog');
const cancelBtn = document.getElementById('cancel-team-btn');
const addPlayerBtn = document.getElementById('add-player-btn');
const form = document.getElementById('create-team-form');
const playersContainer = document.getElementById('players-container');

document.addEventListener('DOMContentLoaded', () => {

    // Close dialog on cancel
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            dialog.classList.remove('active');
            form.reset();
            playersContainer.innerHTML = '';
        });
    }

    // Close dialog when clicking outside
    if (dialog) {
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.classList.remove('active');
                form.reset();
                playersContainer.innerHTML = '';
            }
        });
    }

    // Add player row
    if (addPlayerBtn) {
        addPlayerBtn.addEventListener('click', () => {
            addPlayerRow();
        });
    }

    // Form submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = getFormData();
            
            // Validate form data
            if (!formData.teamName || formData.players.length === 0) {
                alert('Please provide a team name and at least one player');
                return;
            }
            
            try {
                const response = await fetch(`/api/tournaments/${tournamentId}/team`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    alert(error.error || 'Failed to create team');
                    return;
                }
                
                const result = await response.json();
                console.log('Team created:', result);
                
                // Close dialog and reset form
                dialog.classList.remove('active');
                form.reset();
                playersContainer.innerHTML = '';
                
                // Reload tournament info to show the new team
                await fetchTournamentInfo(tournamentId);
                
                
            } catch (error) {
                console.error('Error creating team:', error);
                alert('Connection error. Please try again later.');
            }
        });
    }
});

function addPlayerRow() {
    const playerRow = document.createElement('div');
    playerRow.className = 'player-row';
    const rowIndex = playersContainer.children.length;
    playerRow.innerHTML = `
        <div class="player-input-group">
            <input type="text" name="player-name-${rowIndex}" placeholder="Name" required>
            <input type="text" name="player-surname-${rowIndex}" placeholder="Surname" required>
            <input type="number" name="player-jersey-${rowIndex}" placeholder="Jersey Number" min="1" required>
            <button type="button" class="remove-player-btn">Remove</button>
        </div>
    `;
    playersContainer.appendChild(playerRow);

    // Add remove functionality
    const removeBtn = playerRow.querySelector('.remove-player-btn');
    removeBtn.addEventListener('click', () => {
        playerRow.remove();
    });
}

function getFormData() {
    const teamName = document.getElementById('team-name').value;
    const players = [];
    
    const playerRows = playersContainer.querySelectorAll('.player-row');
    playerRows.forEach(row => {
        const name = row.querySelector('input[name^="player-name"]').value;
        const surname = row.querySelector('input[name^="player-surname"]').value;
        const jerseyNumber = row.querySelector('input[name^="player-jersey"]').value;
        
        if (name && surname && jerseyNumber) {
            players.push({
                name: name,
                surname: surname,
                jerseyNumber: parseInt(jerseyNumber)
            });
        }
    });

    return {
        teamName: teamName,
        players: players
    };
}

