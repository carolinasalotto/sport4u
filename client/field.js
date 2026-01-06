
const id = window.location.pathname.split('/').pop();
const backButton = document.getElementById('back-button');
backButton.addEventListener('click', () => {
    window.history.go(-1);
});
let selected_slots = [];
const available_slots = document.getElementById('available-slots');
const bookFieldButton = document.getElementById('book-field-button');

// Read date and hour from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const urlDate = urlParams.get('date');
const urlHour = urlParams.get('hour');

// Fetch field info
async function fetchFieldInfo(id) {
    const response = await fetch(`/api/fields/${id}`);
    const data = await response.json();
    const fieldInfoElement = document.getElementById('field-info');
    fieldInfoElement.innerHTML = `
    <img class="field-image" src="/uploads/fields/${id}.jpg">
    <h3>${data.name}</h3>
    <p>${data.sport}</p>
    <div class="field-info-item">
        <i data-lucide="map-pin"></i>
        <span>${data.city}, ${data.street} ${data.street_number}</span>
    </div>
    <div class="field-info-item">
        <i data-lucide="clock"></i>
        <span>${removeSeconds(data.open_from)} - ${removeSeconds(data.open_till)}</span>
    </div>
    `;
    
    // Initialize lucide icons for the new elements
    lucide.createIcons();
}


function removeSeconds(time){
    return time.split(":")[0] + ":" + time.split(":")[1];
}
fetchFieldInfo(id);

// Initialize book button state (disabled by default)
updateBookButtonState();

// Calendar functionality
// Initialize currentDate and selectedDate from URL parameters if available
let currentDate = new Date();
let selectedDate = currentDate;

if (urlDate) {
    // Parse the date from URL (format: YYYY-MM-DD)
    const [year, month, day] = urlDate.split('-').map(Number);
    selectedDate = new Date(year, month - 1, day); // month is 0-indexed
    selectedDate.setHours(0, 0, 0, 0);
    // Set currentDate to show the month of the selected date
    currentDate = new Date(year, month - 1, 1);
}

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
                selected_slots = [];
                updateBookButtonState();
            });
        }
        
        datesContainer.appendChild(dateCell);
    }
}

// Initialize calendar when page loads
initCalendar();

// If URL parameters are provided, display slots for the selected date and hour
if (urlDate && selectedDate) {
    // Wait for calendar to render, then display slots
    setTimeout(() => {
        displayAvailableSlots(selectedDate, id, urlHour);
    }, 100);
} else {
    displayAvailableSlots(new Date(), id);
}

async function displayAvailableSlots(date, id, preselectedHour = null){
    // format date as YYYY-MM-DD
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    const formatted_date = `${year}-${month}-${day}`;

    const result = await fetch(`/api/fields/${id}/slots?date=${formatted_date}`);
    const data = await result.json();
    
    
    available_slots.innerHTML = "";
    
    data.forEach( slot => {
        let string_slot = formattedSlot(slot) + " - " + formattedSlot(slot+1);
        const button = document.createElement('button');
        button.innerHTML = string_slot;
        button.id = "slot-button-"+slot;
        available_slots.appendChild(button);
        
        // If this slot matches the preselected hour, select it
        if (preselectedHour !== null && slot === parseInt(preselectedHour)) {
            button.classList.add('selected-slot');
            selected_slots.push(slot);
        }
        
        button.addEventListener('click', ()=>{
            button.classList.toggle('selected-slot');
            if (selected_slots.includes(slot)){
                selected_slots = selected_slots.filter(s => s !== slot);
            }
            else{
                selected_slots.push(slot);
            }

            selected_slots.sort((a, b) => a - b);
            updateSlotButtonStates();
            updateBookButtonState();
        })
    });
    
    // After slots are rendered, update button states if slots are preselected
    if (preselectedHour !== null && selected_slots.length > 0) {
        selected_slots.sort((a, b) => a - b);
        updateSlotButtonStates();
    }
    
    updateBookButtonState();
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

// Update book field button state
function updateBookButtonState() {
    if (bookFieldButton) {
        bookFieldButton.disabled = selected_slots.length === 0 || !selectedDate;
    }
}

// Update button states based on selected slots
function updateSlotButtonStates() {
    if (selected_slots.length === 0) {
        // Enable all buttons if no slots are selected
        document.querySelectorAll('#available-slots button').forEach(btn => {
            btn.disabled = false;
        });
    } else {
        // Disable all buttons first
        document.querySelectorAll('#available-slots button').forEach(btn => {
            btn.disabled = true;
        });

        // Enable first and last selected slot buttons
        const firstSlotBtn = document.getElementById('slot-button-' + (selected_slots[0]));
        if (firstSlotBtn) firstSlotBtn.disabled = false;

        const lastSlotBtn = document.getElementById('slot-button-' + (selected_slots[selected_slots.length-1]));
        if (lastSlotBtn) lastSlotBtn.disabled = false;

        // Enable adjacent buttons (before first and after last)
        const beforeFirstSlotBtn = document.getElementById('slot-button-' + (selected_slots[0] - 1));
        if (beforeFirstSlotBtn) beforeFirstSlotBtn.disabled = false;

        const afterLastSlotBtn = document.getElementById('slot-button-' + (selected_slots[selected_slots.length-1] + 1));
        if (afterLastSlotBtn) afterLastSlotBtn.disabled = false;
    }
}

async function bookField(){
    // Validate that a date and slots are selected
    if (!selectedDate || selected_slots.length === 0) {
        console.error('Cannot book: selectedDate =', selectedDate, 'selected_slots =', selected_slots);
        return;
    }
    
    // Ensure selectedDate is a valid Date object
    if (!(selectedDate instanceof Date) || isNaN(selectedDate.getTime())) {
        console.error('Invalid selectedDate:', selectedDate);
        return;
    }
    
    const start_hour = selected_slots[0];
    const end_hour = selected_slots[selected_slots.length - 1] + 1; // Add 1 because end_hour should be exclusive
    // Format date as YYYY-MM-DD (getMonth() returns 0-11, getDate() returns 1-31)
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    
    // Validate the formatted date
    if (!date || date.includes('undefined') || date.includes('NaN')) {
        console.error('Invalid date format:', date, 'from selectedDate:', selectedDate);
        return;
    }
    
    console.log('Booking request:', { date, start_hour, end_hour, field_id: id });
    
    try {
        const response = await fetch(`/api/fields/${id}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({date, start_hour, end_hour}),
        });
        
        if (response.ok) {
            window.location.href = '/mybookings.html';
        } else {
            const error = await response.json();
        }
    } catch (error) {
        console.error('Error booking field:', error);
    }
}

function clearSelectedSlots(){
    selectedDate = null;
    selected_slots = [];
    available_slots.innerHTML = "";
    updateBookButtonState();
}