let editingTournamentId = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndLoadTournaments();
    
    const createBtn = document.getElementById('create-tournament-btn');
    const dialog = document.getElementById('tournament-dialog');
    const cancelBtn = document.getElementById('tournament-cancel-btn');
    const deleteBtn = document.getElementById('tournament-delete-btn');
    const form = document.getElementById('tournament-form');

    createBtn.addEventListener('click', () => {
        editingTournamentId = null;
        form.reset();
        document.getElementById('tournament-confirm-btn').textContent = 'Confirm';
        deleteBtn.style.display = 'none';
        dialog.classList.add('active');
    });

    cancelBtn.addEventListener('click', () => {
        dialog.classList.remove('active');
        form.reset();
        editingTournamentId = null;
        document.getElementById('tournament-confirm-btn').textContent = 'Confirm';
        deleteBtn.style.display = 'none';
    });

    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.classList.remove('active');
            form.reset();
            editingTournamentId = null;
            document.getElementById('tournament-confirm-btn').textContent = 'Confirm';
            deleteBtn.style.display = 'none';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('tournament-name').value;
        const sport = document.getElementById('tournament-sport').value;
        const maxTeams = document.getElementById('tournament-max-teams').value;
        const startDate = document.getElementById('tournament-start-date').value;
        const startTime = document.getElementById('tournament-start-time').value;
        const description = document.getElementById('tournament-description').value;
        
        // Combine date and time into datetime string (YYYY-MM-DD HH:MM:SS)
        const startDateTime = startDate && startTime ? `${startDate} ${startTime}:00` : startDate;
        
        const url = editingTournamentId 
            ? `/api/tournaments/${editingTournamentId}`
            : '/api/tournaments';
        const method = editingTournamentId ? 'PUT' : 'POST';
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name,
                    sport,
                    maxTeams,
                    startDate: startDateTime,
                    description: description || null
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(editingTournamentId ? 'Tournament updated:' : 'Tournament created:', result);
                dialog.classList.remove('active');
                form.reset();
                editingTournamentId = null;
                document.getElementById('tournament-confirm-btn').textContent = 'Confirm';
                deleteBtn.style.display = 'none';
                await loadTournaments();
            } else {
                const error = await response.json();
                console.error(editingTournamentId ? 'Error updating tournament:' : 'Error creating tournament:', error);
                alert(error.error || (editingTournamentId ? 'Failed to update tournament' : 'Failed to create tournament'));
            }
        } catch (error) {
            console.error(editingTournamentId ? 'Error updating tournament:' : 'Error creating tournament:', error);
            alert('Connection error. Please try again later.');
        }
    });

    deleteBtn.addEventListener('click', () => {
        if (!editingTournamentId) return;
        deleteTournament(editingTournamentId);
    });
});

// Perform the actual deletion
async function performDeleteTournament(tournamentId) {
    const dialog = document.getElementById('tournament-dialog');
    const form = document.getElementById('tournament-form');
    const deleteBtn = document.getElementById('tournament-delete-btn');
    
    try {
        const response = await fetch(`/api/tournaments/${tournamentId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = await response.json();
            console.error('Error deleting tournament:', error);
            alert(error.error || 'Failed to delete tournament');
            return;
        }
        
        const result = await response.json();
        console.log('Tournament deleted:', result);
        dialog.classList.remove('active');
        form.reset();
        editingTournamentId = null;
        document.getElementById('tournament-confirm-btn').textContent = 'Confirm';
        deleteBtn.style.display = 'none';
        await loadTournaments();
    } catch (error) {
        console.error('Error deleting tournament:', error);
        alert('Connection error. Please try again later.');
    }
}

// Show delete confirmation dialog
async function deleteTournament(tournamentId) {
    // Check if dialog already exists, if not create it
    let confirmDialog = document.getElementById('confirm-delete-dialog');
    
    if (!confirmDialog) {
        // Create overlay
        confirmDialog = document.createElement('div');
        confirmDialog.id = 'confirm-delete-dialog';
        confirmDialog.className = 'dialog-overlay';
        
        // Set innerHTML with dialog structure
        confirmDialog.innerHTML = `
            <div class="dialog-modal">
                <div class="dialog-header">
                    <h3>Delete Tournament</h3>
                </div>
                <div class="dialog-body">
                    <p>Are you sure you want to delete this tournament? This action cannot be undone.</p>
                </div>
                <div class="dialog-footer">
                    <button id="dialog-cancel-btn" class="dialog-btn dialog-btn-secondary">No, Keep Tournament</button>
                    <button id="dialog-confirm-btn" class="dialog-btn dialog-btn-primary">Yes, Delete Tournament</button>
                </div>
            </div>
        `;
        
        // Attach event listeners
        const cancelBtn = confirmDialog.querySelector('#dialog-cancel-btn');
        const confirmBtn = confirmDialog.querySelector('#dialog-confirm-btn');
        
        cancelBtn.addEventListener('click', () => {
            confirmDialog.classList.remove('show');
        });
        
        confirmBtn.addEventListener('click', () => {
            const id = confirmDialog.dataset.tournamentId;
            if (id) {
                confirmDialog.classList.remove('show');
                performDeleteTournament(parseInt(id));
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
    
    // Store tournament ID in dataset
    confirmDialog.dataset.tournamentId = tournamentId;
    
    // Show dialog
    confirmDialog.classList.add('show');
}

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

// Open edit tournament form with pre-filled data
function openEditTournamentForm(tournamentData) {
    const dialog = document.getElementById('tournament-dialog');
    const form = document.getElementById('tournament-form');
    
    // Store the tournament ID for the update operation
    editingTournamentId = tournamentData.id;
    
    // Fill form fields with tournament data
    document.getElementById('tournament-name').value = tournamentData.name;
    document.getElementById('tournament-sport').value = tournamentData.sport;
    document.getElementById('tournament-max-teams').value = tournamentData.maxTeams;
    
    // Split datetime into date and time
    if (tournamentData.startDate) {
        // Handle both ISO format (YYYY-MM-DDTHH:MM:SS) and MySQL format (YYYY-MM-DD HH:MM:SS)
        const datetimeStr = tournamentData.startDate.replace(' ', 'T');
        const datetime = new Date(datetimeStr);
        const dateStr = datetime.toISOString().split('T')[0];
        const hours = String(datetime.getHours()).padStart(2, '0');
        const minutes = String(datetime.getMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;
        document.getElementById('tournament-start-date').value = dateStr;
        document.getElementById('tournament-start-time').value = timeStr;
    }
    
    document.getElementById('tournament-description').value = tournamentData.description || '';
    
    // Update button text
    document.getElementById('tournament-confirm-btn').textContent = 'Save Changes';
    
    // Show delete button
    document.getElementById('tournament-delete-btn').style.display = 'block';
    
    // Show dialog
    dialog.classList.add('active');
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
        const timeStr = startDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Format date for input field (YYYY-MM-DD)
        const dateInputValue = tournament.start_date.split('T')[0];
        
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
                        <button class="edit-tournament-btn"
                                data-tournament-id="${tournament.id}" 
                                data-tournament-name="${tournament.name}" 
                                data-tournament-sport="${tournament.sport}" 
                                data-tournament-max-teams="${tournament.max_teams}" 
                                data-tournament-start-date="${tournament.start_date}" 
                                data-tournament-description="${tournament.description || ''}">Edit</button>
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
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.edit-tournament-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tournamentData = {
                id: btn.getAttribute('data-tournament-id'),
                name: btn.getAttribute('data-tournament-name'),
                sport: btn.getAttribute('data-tournament-sport'),
                maxTeams: btn.getAttribute('data-tournament-max-teams'),
                startDate: btn.getAttribute('data-tournament-start-date'),
                description: btn.getAttribute('data-tournament-description')
            };
            openEditTournamentForm(tournamentData);
        });
    });
}

