

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
    const fieldsElement = document.getElementById('campi-row');
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
