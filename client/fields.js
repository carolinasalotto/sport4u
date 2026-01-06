const searchInput = document.getElementById('search-input');
const sportFilter = document.getElementById('sport-filter');
const resultsContainer = document.getElementById('fields-results');

let searchTimeout;

// Handle search input with debouncing
searchInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    
    // Clear previous timeout
    clearTimeout(searchTimeout);
    
    
    // Debounce search to avoid too many API calls
    searchTimeout = setTimeout(() => {
        searchFields();
    }, 300);
});

// Handle sport filter change
sportFilter.addEventListener('change', () => {
    searchFields();
});

// Function to search fields
async function searchFields() {
    try {
        const query = searchInput.value.trim();
        const sport = sportFilter.value;
        
        // Show loading state
        resultsContainer.innerHTML = '<p>Searching...</p>';
        
        // Build query parameters
        const params = new URLSearchParams();
        if (query) {
            params.set('q', query);
        }
        if (sport) {
            params.set('sport', sport);
        }
        
        // Make API call
        const url = params.toString() ? `/api/fields?${params.toString()}` : '/api/fields';
        const response = await fetch(url);
        
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
}

// Display search results using same classes as search-fields.html
function displayResults(fields) {
    if (fields.length === 0) {
        resultsContainer.innerHTML = '<p>No fields found.</p>';
        return;
    }
    
    let fieldsHTML = '';
    
    fields.forEach(field => {
        // Build URL to field details
        const fieldUrl = `/field/${field.id}`;
        
        fieldsHTML += `
            <div class="field-card">
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
        <h2>Found Fields (${fields.length})</h2>
        <div class="fields-grid">
            ${fieldsHTML}
        </div>
    `;
    
    // Initialize lucide icons for the new cards
    lucide.createIcons();
}

// Load all fields on page load
searchFields();

