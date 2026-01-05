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
    const response = await fetch('/api/fields?limit=6');
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

// Arrow navigation for fields row
const fieldsRow = document.getElementById('fields-row');
const scrollLeftBtn = document.getElementById('scroll-left');
const scrollRightBtn = document.getElementById('scroll-right');

function updateArrowVisibility() {
    const isScrollable = fieldsRow.scrollWidth > fieldsRow.clientWidth; // Check if the fields row is scrollable (scrollWidht=total width of the fields row, clientWidth=width of the viewport)
    scrollLeftBtn.style.display = isScrollable ? 'flex' : 'none';
    scrollRightBtn.style.display = isScrollable ? 'flex' : 'none';
    
    // Update left arrow visibility
    scrollLeftBtn.style.opacity = fieldsRow.scrollLeft > 0 ? '1' : '0';
    scrollLeftBtn.style.pointerEvents = fieldsRow.scrollLeft > 0 ? 'auto' : 'none';
    
    // Update right arrow visibility
    const isAtEnd = fieldsRow.scrollLeft + fieldsRow.clientWidth >= fieldsRow.scrollWidth - 1;
    scrollRightBtn.style.opacity = isAtEnd ? '0' : '1';
    scrollRightBtn.style.pointerEvents = isAtEnd ? 'none' : 'auto';
}

scrollLeftBtn.addEventListener('click', () => {
    fieldsRow.scrollBy({ left: -300, behavior: 'smooth' });
});

scrollRightBtn.addEventListener('click', () => {
    fieldsRow.scrollBy({ left: 300, behavior: 'smooth' });
});

fieldsRow.addEventListener('scroll', updateArrowVisibility);

// Update on window resize and after fields load
window.addEventListener('resize', updateArrowVisibility);
setTimeout(updateArrowVisibility, 100); // Initial check after fields load



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