// Tab functionality
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.id;
        
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        document.getElementById(targetTab + '-content').classList.add('active');
    });
});


// Fetch fields
async function fetchFields() {
    const response = await fetch('/api/fields');
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