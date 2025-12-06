// Login Functions - UPDATED for checklist form
function initializeLogin() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;
    
    // Auto-check fields when they're filled
    const inputs = loginForm.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            const checklistItem = this.closest('.checklist-item');
            const checkbox = checklistItem.querySelector('.checkbox');
            
            if (this.value.trim()) {
                checkbox.textContent = '☑';
                checkbox.classList.remove('unchecked');
                checkbox.classList.add('checked');
            } else {
                checkbox.textContent = '☐';
                checkbox.classList.remove('checked');
                checkbox.classList.add('unchecked');
            }
        });
    });
    
    // Auto-check the surname field (pre-filled in HTML)
    const surnameField = document.getElementById('surname');
    if (surnameField && surnameField.value.trim()) {
        const surnameItem = surnameField.closest('.checklist-item');
        const surnameCheckbox = surnameItem.querySelector('.checkbox');
        surnameCheckbox.textContent = '☑';
        surnameCheckbox.classList.remove('unchecked');
        surnameCheckbox.classList.add('checked');
    }
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const surname = document.getElementById('surname').value.trim();
        const group = document.getElementById('group').value.trim();
        
        // Validation
        if (!name || !surname || !group) {
            showNotification('Please fill all fields', 'error');
            
            // Highlight empty fields
            if (!name) {
                document.getElementById('name').style.borderColor = '#f44336';
            }
            if (!surname) {
                document.getElementById('surname').style.borderColor = '#f44336';
            }
            if (!group) {
                document.getElementById('group').style.borderColor = '#f44336';
            }
            
            return;
        }
        
        // Validate group format (optional)
        const validGroups = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const groupUpper = group.toUpperCase();
        if (!validGroups.includes(groupUpper)) {
            showNotification('Group should be A1, A2, B1, B2, C1, or C2', 'warning');
        }
        
        // Create user object
        AppState.currentUser = {
            name,
            surname,
            group: groupUpper, // Store in uppercase
            loginTime: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(AppState.currentUser));
        
        // Show loading animation
        showLoading(true);
        
        // Navigate to main menu after brief delay
        setTimeout(() => {
            showPage('main-menu');
            updateUserInfo();
            loadProgress();
            generateArticlesGrid();
            showLoading(false);
            showNotification(`Welcome, ${name}!`, 'success');
        }, 1000);
    });
}
