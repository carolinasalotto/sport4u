// Load bookings when page loads
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndLoadBookings();
});


// Check if user is logged in, redirect if not
async function checkAuthAndLoadBookings() {
    const authStatus = await checkLogin();
    
    if (!authStatus.isLoggedIn) {
        // Redirect to login page if not authenticated
        window.location.href = '/login.html';
        return;
    }
    
    // Load bookings if authenticated
    await loadBookings();
}

// Load and display bookings
async function loadBookings() {
    const resultsContainer = document.getElementById('bookings-results');
    
    try {
        // Show loading state
        resultsContainer.innerHTML = '<p>Loading your bookings...</p>';
        
        // Fetch bookings from API
        const response = await fetch('/api/bookings', {
            credentials: 'include' // Include cookies for authentication
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Not authenticated, redirect to login
                window.location.href = '/login.html';
                return;
            }
            const error = await response.json();
            throw new Error(error.error || 'Failed to load bookings');
        }
        
        const bookings = await response.json();
        
        // Display results
        displayBookings(bookings);
    } catch (error) {
        console.error('Error loading bookings:', error);
        resultsContainer.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}

// Display bookings in the UI
function displayBookings(bookings) {
    const resultsContainer = document.getElementById('bookings-results');
    
    if (bookings.length === 0) {
        resultsContainer.innerHTML = '<p class="no-bookings">You don\'t have any bookings yet.</p>';
        return;
    }
    
    let bookingsHTML = '';
    bookings.forEach(booking => {
        // Parse the booked_datetime
        const bookedDate = new Date(booking.booked_datetime);
        const startHour = bookedDate.getHours();
        const durationHours = booking.duration / 60;
        const endHour = startHour + durationHours;
        
        // Format date and time
        const dateStr = bookedDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const timeStr = `${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00`;
        
        bookingsHTML += `
            <div class="booking-card">
                <div class="booking-header">
                    <h3>${booking.field_name}</h3>
                    <span class="sport-badge">${booking.sport}</span>
                </div>
                <div class="booking-details">
                    <p class="booking-date"><strong>Date:</strong> ${dateStr}</p>
                    <p class="booking-time"><strong>Time:</strong> ${timeStr}</p>
                    <p class="booking-duration"><strong>Duration:</strong> ${durationHours} hour${durationHours !== 1 ? 's' : ''}</p>
                    <p class="booking-address"><strong>Address:</strong> ${booking.full_address}</p>
                </div>
                <div class="booking-actions">
                    <button onclick="deleteBooking(${booking.id}, ${booking.field_id})" class="delete-booking-btn" data-booking-id="${booking.id}" data-field-id="${booking.field_id}"><i data-lucide="trash-2"></i></button>
                    <a href="/field/${booking.field_id}" class="view-field-btn">View Field</a>
                </div>
            </div>
        `;
        
    });
    
    resultsContainer.innerHTML = `
        <h2>Your Bookings (${bookings.length})</h2>
        <div class="bookings-grid">
            ${bookingsHTML}
        </div>
    `;

    // Attach event listeners to delete booking buttons
    document.querySelectorAll('.delete-booking-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const bookingId = parseInt(btn.getAttribute('data-booking-id'));
            const fieldId = parseInt(btn.getAttribute('data-field-id'));
            deleteBooking(bookingId, fieldId);
        });
    });

    // Initialize lucide icons for delete buttons
    lucide.createIcons();

}


// Perform the actual deletion
async function performDelete(id, fieldId) {
    try {
        const response = await fetch(`/api/fields/${fieldId}/bookings/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!response.ok) {
            const errData = await response.json();
            console.error('Failed to delete booking:', errData);
            alert('Failed to cancel booking. Please try again.');
            return;
        }
        
        // Reload bookings after successful deletion
        await loadBookings();
    } catch (error) {
        console.error('Error while deleting booking:', error);
        alert('An error occurred while canceling the booking. Please try again.');
    }
}

async function deleteBooking(id, fieldId){
    // Check if dialog already exists, if not create it
    let dialog = document.getElementById('confirm-dialog');
    
    if (!dialog) {
        // Create overlay
        dialog = document.createElement('div');
        dialog.id = 'confirm-dialog';
        dialog.className = 'dialog-overlay';
        
        // Set innerHTML with dialog structure
        dialog.innerHTML = `
            <div class="dialog-modal">
                <div class="dialog-header">
                    <h3>Cancel Booking</h3>
                </div>
                <div class="dialog-body">
                    <p>Are you sure you want to cancel this booking? This action cannot be undone.</p>
                </div>
                <div class="dialog-footer">
                    <button id="dialog-cancel-btn" class="dialog-btn dialog-btn-secondary">No, Keep Booking</button>
                    <button id="dialog-confirm-btn" class="dialog-btn dialog-btn-primary">Yes, Cancel Booking</button>
                </div>
            </div>
        `;
        
        // Attach event listeners
        const cancelBtn = dialog.querySelector('#dialog-cancel-btn');
        const confirmBtn = dialog.querySelector('#dialog-confirm-btn');
        
        cancelBtn.addEventListener('click', () => {
            dialog.classList.remove('show');
        });
        
        confirmBtn.addEventListener('click', () => {
            const bookingId = dialog.dataset.bookingId;
            const fieldId = dialog.dataset.fieldId;
            if (bookingId && fieldId) {
                dialog.classList.remove('show');
                performDelete(parseInt(bookingId), parseInt(fieldId));
            }
        });
        
        // Close dialog when clicking outside
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.classList.remove('show');
            }
        });
        
        // Append to body
        document.body.appendChild(dialog);
    }
    
    // Store booking info in dataset
    dialog.dataset.bookingId = id;
    dialog.dataset.fieldId = fieldId;
    
    // Show dialog
    dialog.classList.add('show');
}



