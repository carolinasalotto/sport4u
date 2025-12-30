

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
    <img class="field-image" src="/uploads/fields/${id}.jpg">
    <h3>${data.name}</h3>
    <p>${data.sport}</p>
    <p>${data.city}, ${data.street} ${data.street_number}</p>
    <p>Opening Hours: ${removeSeconds(data.open_from)} - ${removeSeconds(data.open_till)}
    `;
}


function removeSeconds(time){
    return time.split(":")[0] + ":" + time.split(":")[1];
}
fetchFieldInfo(window.location.pathname.split('/').pop());