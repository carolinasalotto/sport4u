const backButton = document.getElementById('back-button');
backButton.addEventListener('click', () => {
    window.history.go(-1);
});

// Get tournament ID from URL
const pathParts = window.location.pathname.split('/');
const tournamentId = pathParts[pathParts.length - 1];

// Store if current user is creator
let isTournamentCreator = false;

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
        isTournamentCreator = isCreator;
        
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
    const timeStr = startDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
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
            <div class="detail-items-inline">
                <div class="detail-item">
                    <strong>Start Date:</strong>
                    <span>${dateStr} at ${timeStr}</span>
                </div>
                <div class="detail-item">
                    <strong>Maximum Teams:</strong>
                    <span>${tournament.max_teams}</span>
                </div>
                <div class="detail-item">
                    <strong>Created By:</strong>
                    <span>${createdByName}</span>
                </div>
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
            <div class="teams-section-header">
                <h2>Teams (${tournament.teams.length}/${tournament.max_teams})</h2>
                ${isCreator ? `
                <button id="create-team-btn" class="create-team-btn">Create Team</button>
                ` : ''}
            </div>
            <div class="teams-grid">
                ${tournament.teams.map(team => `
                    <div class="team-card" data-team-id="${team.id}">
                        <div class="team-card-header">
                            <h3>${team.name}</h3>
                            ${isCreator ? `
                            <button class="delete-team-btn" data-team-id="${team.id}" data-team-name="${team.name}"><i data-lucide="trash-2"></i></button>
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
            <div class="teams-section-header">
                <h2>Teams (0/${tournament.max_teams})</h2>
                ${isCreator ? `
                <button id="create-team-btn" class="create-team-btn">Create Team</button>
                ` : ''}
            </div>
            <p class="no-teams">No teams registered yet.</p>
        </div>
        `}
        <div id="matches-section" class="matches-section">
            <div class="matches-section-header">
                <h2>Match Schedule</h2>
                ${isCreator ? `
                <button id="generate-matches-btn" class="generate-matches-btn">Generate Match Schedule</button>
                ` : ''}
            </div>
            <div id="matches-container" style="display: none;"></div>
        </div>
        <div id="standings-section" class="standings-section" style="display: none;">
            <h2>Standings</h2>
            <div id="standings-container"></div>
        </div>
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
    
    // Initialize lucide icons for delete buttons
    lucide.createIcons();
    
    // Attach event listener to generate matches button if it exists
    const generateMatchesBtn = document.getElementById('generate-matches-btn');
    if (generateMatchesBtn) {
        generateMatchesBtn.addEventListener('click', () => {
            generateMatchSchedule();
        });
    }
    
    // Load matches if they exist
    loadMatches();
    
    // Load standings
    loadStandings();
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

// Generate match schedule
async function generateMatchSchedule() {
    const generateBtn = document.getElementById('generate-matches-btn');
    const originalContent = generateBtn.innerHTML;
    const startTime = Date.now();
    
    // Show loading spinner
    generateBtn.innerHTML = '<span class="spinner"></span> Generating...';
    generateBtn.disabled = true;
    
    try {
        const response = await fetch(`/api/tournaments/${tournamentId}/matches/generate`, {
            method: 'POST',
            credentials: 'include'
        });
        
        // Ensure minimum 1 second loading time
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsed);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.error || 'Failed to generate match schedule');
            generateBtn.innerHTML = originalContent;
            generateBtn.disabled = false;
            return;
        }
        
        // Reload matches to display them
        await loadMatches();
        
        // Restore button
        generateBtn.innerHTML = originalContent;
        generateBtn.disabled = false;
    } catch (error) {
        console.error('Error generating match schedule:', error);
        alert('Connection error. Please try again later.');
        generateBtn.innerHTML = originalContent;
        generateBtn.disabled = false;
    }
}

// Load and display matches
async function loadMatches() {
    try {
        const response = await fetch(`/api/tournaments/${tournamentId}/matches`);
        
        if (!response.ok) {
            if (response.status === 404) {
                // No matches found, hide matches container
                document.getElementById('matches-container').style.display = 'none';
                return;
            }
            throw new Error('Failed to fetch matches');
        }
        
        const matches = await response.json();
        
        if (matches.length === 0) {
            document.getElementById('matches-container').style.display = 'none';
            return;
        }
        
        displayMatches(matches, isTournamentCreator);
    } catch (error) {
        console.error('Error loading matches:', error);
        // Don't show error to user, just hide matches container
        document.getElementById('matches-container').style.display = 'none';
    }
}

// Display matches
function displayMatches(matches, isCreator) {
    const matchesContainer = document.getElementById('matches-container');
    
    matchesContainer.style.display = 'block';
    
    matchesContainer.innerHTML = `
        <table class="matches-table">
            <thead>
                <tr>
                    <th>Date & Time</th>
                    <th>Team 1</th>
                    <th>Team 2</th>
                    <th>Score</th>
                    ${isCreator ? '<th></th>' : ''}
                </tr>
            </thead>
            <tbody>
                ${matches.map(match => {
                    const score1 = match.score_team1 !== null ? match.score_team1 : '-';
                    const score2 = match.score_team2 !== null ? match.score_team2 : '-';
                    let datetimeStr = '-';
                    let canEditResult = false;
                    if (match.datetime) {
                        const matchDate = new Date(match.datetime);
                        datetimeStr = matchDate.toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        // Check if match datetime has passed
                        const now = new Date();
                        canEditResult = matchDate <= now;
                    }
                    return `
                    <tr>
                        <td>${datetimeStr}</td>
                        <td>${match.team1.name}</td>
                        <td>${match.team2.name}</td>
                        <td class="score-cell">${score1} - ${score2}</td>
                        ${isCreator ? `
                        <td>
                            ${canEditResult ? `
                            <button class="edit-result-btn" data-match-id="${match.id}" 
                                    data-team1-name="${match.team1.name}" 
                                    data-team2-name="${match.team2.name}"
                                    data-score1="${match.score_team1 !== null ? match.score_team1 : ''}"
                                    data-score2="${match.score_team2 !== null ? match.score_team2 : ''}"
                                    data-datetime="${match.datetime || ''}">
                                Edit Result
                            </button>
                            ` : `
                            <span class="match-not-started">Match not started</span>
                            `}
                        </td>
                        ` : ''}
                    </tr>
                `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    // Attach event listeners to edit result buttons
    if (isCreator) {
        document.querySelectorAll('.edit-result-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const matchId = parseInt(btn.getAttribute('data-match-id'));
                const team1Name = btn.getAttribute('data-team1-name');
                const team2Name = btn.getAttribute('data-team2-name');
                const score1 = btn.getAttribute('data-score1');
                const score2 = btn.getAttribute('data-score2');
                const matchDateTime = btn.getAttribute('data-datetime');
                openEditResultDialog(matchId, team1Name, team2Name, score1, score2, matchDateTime);
            });
        });
    }
}

// Open edit result dialog
function openEditResultDialog(matchId, team1Name, team2Name, score1, score2, matchDateTime) {
    // Double-check that match datetime has passed
    if (matchDateTime) {
        const matchDate = new Date(matchDateTime);
        const now = new Date();
        if (matchDate > now) {
            alert('Cannot enter results before the match datetime');
            return;
        }
    }
    
    const dialog = document.getElementById('edit-result-dialog');
    const form = document.getElementById('edit-result-form');
    const team1Label = document.getElementById('result-team1-label');
    const team2Label = document.getElementById('result-team2-label');
    const score1Input = document.getElementById('result-score1');
    const score2Input = document.getElementById('result-score2');
    
    team1Label.textContent = `${team1Name} Score:`;
    team2Label.textContent = `${team2Name} Score:`;
    score1Input.value = score1 || '';
    score2Input.value = score2 || '';
    
    // Store match ID in form dataset
    form.dataset.matchId = matchId;
    
    dialog.classList.add('active');
}

// Close edit result dialog
function closeEditResultDialog() {
    const dialog = document.getElementById('edit-result-dialog');
    const form = document.getElementById('edit-result-form');
    dialog.classList.remove('active');
    form.reset();
    delete form.dataset.matchId;
}

// Initialize edit result dialog
document.addEventListener('DOMContentLoaded', () => {
    const editResultDialog = document.getElementById('edit-result-dialog');
    const editResultForm = document.getElementById('edit-result-form');
    const cancelResultBtn = document.getElementById('cancel-result-btn');
    
    // Close dialog on cancel
    if (cancelResultBtn) {
        cancelResultBtn.addEventListener('click', () => {
            closeEditResultDialog();
        });
    }
    
    // Close dialog when clicking outside
    if (editResultDialog) {
        editResultDialog.addEventListener('click', (e) => {
            if (e.target === editResultDialog) {
                closeEditResultDialog();
            }
        });
    }
    
    // Form submission
    if (editResultForm) {
        editResultForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const matchId = parseInt(editResultForm.dataset.matchId);
            const score1 = document.getElementById('result-score1').value;
            const score2 = document.getElementById('result-score2').value;
            
            if (!matchId) {
                alert('Error: Match ID not found');
                return;
            }
            
            try {
                const response = await fetch(`/api/matches/${matchId}/result`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        score_team1: score1 === '' ? null : parseInt(score1),
                        score_team2: score2 === '' ? null : parseInt(score2)
                    })
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    alert(error.error || 'Failed to update match result');
                    return;
                }
                
                // Close dialog
                closeEditResultDialog();
                
                // Reload matches to show updated scores
                await loadMatches();
                
                // Reload standings after result update
                await loadStandings();
            } catch (error) {
                console.error('Error updating match result:', error);
                alert('Connection error. Please try again later.');
            }
        });
    }
});

// Load and display standings
async function loadStandings() {
    try {
        const response = await fetch(`/api/tournaments/${tournamentId}/standings`);
        
        if (!response.ok) {
            if (response.status === 404) {
                document.getElementById('standings-section').style.display = 'none';
                return;
            }
            throw new Error('Failed to fetch standings');
        }
        
        const standings = await response.json();
        
        if (standings.length === 0) {
            document.getElementById('standings-section').style.display = 'none';
            return;
        }
        
        displayStandings(standings);
    } catch (error) {
        console.error('Error loading standings:', error);
        document.getElementById('standings-section').style.display = 'none';
    }
}

// Display standings
function displayStandings(standings) {
    const standingsSection = document.getElementById('standings-section');
    const standingsContainer = document.getElementById('standings-container');
    
    standingsSection.style.display = 'block';
    
    standingsContainer.innerHTML = `
        <table class="standings-table">
            <thead>
                <tr>
                    <th>Position</th>
                    <th>Team</th>
                    <th>Points</th>
                    <th>Matches</th>
                    <th>Scored</th>
                    <th>Conceded</th>
                    <th>Difference</th>
                </tr>
            </thead>
            <tbody>
                ${standings.map((team, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${team.teamName}</td>
                        <td>${team.points}</td>
                        <td>${team.matchesPlayed}</td>
                        <td>${team.scored}</td>
                        <td>${team.conceded}</td>
                        <td>${team.difference >= 0 ? '+' : ''}${team.difference}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
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

