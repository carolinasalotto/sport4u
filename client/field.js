
const id = window.location.pathname.split('/').pop();
const backButton = document.getElementById('back-button');
backButton.addEventListener('click', () => {
    window.history.go(-1);
});
let selected_slot = [];
const available_slots = document.getElementById('available-slots');

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
fetchFieldInfo(id);

// Calendar functionality
let currentDate = new Date();
let selectedDate = currentDate;

function initCalendar() {
    const prevButton = document.getElementById('prev-month');
    const nextButton = document.getElementById('next-month');
    
    prevButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        clearSelectedSlots();
        renderCalendar();
    });
    
    nextButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        clearSelectedSlots();
        renderCalendar();
    });
    
    renderCalendar();
}

function renderCalendar() {
    const monthYearElement = document.getElementById('month-year');
    const datesContainer = document.getElementById('calendar-dates');
    
    // Update month-year header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    // Clear previous dates
    datesContainer.innerHTML = '';
    
    // Get first day of month and number of days
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
    // Adjust to start week on Monday (0 = Monday, 6 = Sunday)
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1; // Convert Sunday (0) to 6, others shift by 1
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'date-cell empty';
        datesContainer.appendChild(emptyCell);
    }
    
    // Add date cells
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateCell = document.createElement('div');
        dateCell.className = 'date-cell';
        dateCell.textContent = day;
        
        // Create date object for this cell
        const cellDate = new Date(year, month, day);
        cellDate.setHours(0, 0, 0, 0);
        
        // Check if this date is in the past
        const isPastDate = cellDate < today;
        
        if (isPastDate) {
            dateCell.classList.add('disabled');
        }
        
        // Check if this date is selected
        if (selectedDate && 
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === month &&
            selectedDate.getFullYear() === year) {
            dateCell.classList.add('selected');
        }
        
        // Check if this date is today
        if (day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()) {
            dateCell.classList.add('today');
        }
        
        // Add click handler only if date is not in the past
        if (!isPastDate) {
            dateCell.addEventListener('click', () => {
                // Remove selected class from all dates
                document.querySelectorAll('.date-cell').forEach(cell => {
                    cell.classList.remove('selected');
                });
                
                // Add selected class to clicked date
                dateCell.classList.add('selected');
                
                // Update selected date
                selectedDate = new Date(year, month, day);
                displayAvailableSlots(selectedDate, id);
                selected_slot = [];
            });
        }
        
        datesContainer.appendChild(dateCell);
    }
}

// Initialize calendar when page loads
initCalendar();


async function displayAvailableSlots(date, id){
    // format date as gg-mm-yyyy
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    const formatted_date = `${day}-${month}-${year}`;

    const result = await fetch(`/api/fields/${id}/${formatted_date}`);
    const data = await result.json();
    
    
    available_slots.innerHTML = "";
    
    data.forEach( slot => {
        let string_slot = formattedSlot(slot) + " - " + formattedSlot(slot+1);
        const button = document.createElement('button');
        button.innerHTML = string_slot;
        available_slots.appendChild(button);
        button.addEventListener('click', ()=>{
            button.classList.toggle('selected-slot');
            if (selected_slot.includes(slot)){
                selected_slot = selected_slot.filter(s => s !== slot);
            }
            else{
                selected_slot.push(slot);
            }
        })
    });
    
}

function formattedSlot(slot){
    let string_slot;
    if(slot < 10){
        string_slot = `0${slot}:00`;
    }
    else{
        string_slot = String(slot)+":00";
    }
    return string_slot;
}

displayAvailableSlots(new Date(), id);

function bookField(){
    console.log(selected_slot);
}

function clearSelectedSlots(){
    selectedDate = null;
    selected_slot = [];
    available_slots.innerHTML = "";
}