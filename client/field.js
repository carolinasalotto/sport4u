

const backButton = document.getElementById('back-button');
backButton.addEventListener('click', () => {
    window.location.href = '/';
});

// Fetch field info
async function fetchFieldInfo(id) {
    const response = await fetch(`/api/fields/${id}`);
    const data = await response.json();
    const fieldInfoElement = document.getElementById('field-info');
    fieldInfoElement.innerHTML = `
    <h3>${data.name}</h3>
    <p>${data.sport}</p>
    <p>${data.city}, ${data.street} ${data.street_number}</p>
    `;
}

fetchFieldInfo(window.location.pathname.split('/').pop());