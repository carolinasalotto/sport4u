
const urlParams = new URLSearchParams(window.location.search);

// Set city
const city = urlParams.get('city');
if (city) {
    const citySelect = document.getElementById('city');
    if (citySelect) {
        citySelect.value = city;
    }
}

// Set sport
const sport = urlParams.get('sport');
if (sport) {
    const sportSelect = document.getElementById('sport');
    if (sportSelect) {
        sportSelect.value = sport;
    }
}

// Set date
const date = urlParams.get('date');
if (date) {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.value = date;
    }
}

// Set hour
const hour = urlParams.get('hour');
if (hour) {
    const hourSelect = document.getElementById('hour');
    if (hourSelect) {
        hourSelect.value = hour;
    }
}

// Handle form submission
const searchForm = document.getElementById('search-fields-form');
const resultsContainer = document.getElementById('fields-results');

if (searchForm) {
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const city = document.getElementById('city').value;
        const sport = document.getElementById('sport').value;
        const date = document.getElementById('date').value;
        const hour = document.getElementById('hour').value;
        
        // Update URL with search parameters
        const params = new URLSearchParams({ city, sport, date, hour });
        window.history.pushState({}, '', `?${params.toString()}`);
        
        try {
            // Show loading state
            resultsContainer.innerHTML = '<p>Searching...</p>';
            // Make API call with parameters in the request body (POST)
            const response = await fetch('/api/fields/search-fields', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ city, sport, date, hour })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to search fields');
            }
            
            const fields = await response.json();
            
            // Display results
            displayResults(fields);
        } catch (error) {
            console.error('Error searching fields:', error);
            resultsContainer.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    });
}

// Display search results
function displayResults(fields) {
    if (fields.length === 0) {
        resultsContainer.innerHTML = '<p>No available fields found for your search criteria.</p>';
        return;
    }
    
    let fieldsHTML = '';
    const urlParams = new URLSearchParams(window.location.search);
    const date = urlParams.get('date');
    const hour = urlParams.get('hour');
    
    fields.forEach(field => {
        // Build URL with date and hour parameters if they exist
        let fieldUrl = `/field/${field.id}`;
        if (date && hour) {
            fieldUrl += `?date=${encodeURIComponent(date)}&hour=${encodeURIComponent(hour)}`;
        }
        
        fieldsHTML += `
            <div class="field-card" data-field-url="${fieldUrl}">
                <div class="field-card-header">
                    <h3>${field.name}</h3>
                    <span class="field-sport-badge">${field.sport}</span>
                </div>
                <div class="field-card-body">
                    <div class="field-info-item">
                        <i data-lucide="map-pin"></i>
                        <span>${field.full_address}</span>
                    </div>
                    <div class="field-info-item">
                        <i data-lucide="clock"></i>
                        <span>${field.open_from} - ${field.open_till}</span>
                    </div>
                </div>
                <div class="field-card-footer">
                    <a href="${fieldUrl}" class="view-details-btn">View Details</a>
                </div>
            </div>
        `;
    });
    resultsContainer.innerHTML = `
        <h2>Available Fields (${fields.length})</h2>
        <div class="fields-grid">
            ${fieldsHTML}
        </div>
    `;
    
    // Initialize lucide icons for the new cards
    lucide.createIcons();
    
    // Make field cards clickable
    const fieldCards = resultsContainer.querySelectorAll('.field-card');
    fieldCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't navigate if clicking on the button (let the link handle it)
            if (e.target.closest('.view-details-btn')) {
                return;
            }
            const fieldUrl = card.getAttribute('data-field-url');
            if (fieldUrl) {
                window.location.href = fieldUrl;
            }
        });
    });
}

// Auto-search if URL parameters are present (after DOM is ready)
if (city && sport && date && hour && searchForm) {
    // Use setTimeout to ensure form handler is attached
    setTimeout(() => {
        searchForm.dispatchEvent(new Event('submit'));
    }, 0);
}