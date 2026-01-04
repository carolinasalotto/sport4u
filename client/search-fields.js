
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
    fields.forEach(field => {
        fieldsHTML += `
            <div class="field-card">
                <h3>${field.name}</h3>
                <p><strong>Sport:</strong> ${field.sport}</p>
                <p><strong>Address:</strong> ${field.full_address}</p>
                <p><strong>Opening Hours:</strong> ${field.open_from} - ${field.open_till}</p>
                <a href="/field/${field.id}" class="view-details-btn">View Details</a>
            </div>
        `;
    });
    resultsContainer.innerHTML = `
        <h2>Available Fields (${fields.length})</h2>
        <div class="fields-grid">
            ${fieldsHTML}
        </div>
    `;
}

// Auto-search if URL parameters are present (after DOM is ready)
if (city && sport && date && hour && searchForm) {
    // Use setTimeout to ensure form handler is attached
    setTimeout(() => {
        searchForm.dispatchEvent(new Event('submit'));
    }, 0);
}