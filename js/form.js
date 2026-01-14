/**
 * CODEFARM Application Form Handler
 * Submits form data to Google Sheets via Google Apps Script
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('applicationForm');
    const formMessage = document.getElementById('formMessage');
    
    if (!form) return;
    
    // Get the Google Apps Script URL from environment or config
    const SCRIPT_URL = window.GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwiUfQKcxkLjIGaaEeefYGWgPck01YamqZg-Spq6TeX2aoFchJxzjFttlksk37Pzrbe/exec';
    
    /**
     * Show message to user
     */
    function showMessage(text, type = 'loading') {
        formMessage.textContent = text;
        formMessage.className = `form-message show ${type}`;
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    /**
     * Hide message
     */
    function hideMessage() {
        formMessage.className = 'form-message';
    }
    
    /**
     * Handle form submission
     */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate form
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Check if script URL is configured
        if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            showMessage('Error: Google Sheets integration not configured. Please set up the Google Apps Script URL.', 'error');
            return;
        }
        
        // Disable submit button
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        
        // Show loading message
        showMessage('Submitting your application...', 'loading');
        
        // Collect form data
        const formData = new FormData(form);
        const data = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            location: formData.get('location'),
            dob: formData.get('dob'),
            gender: formData.get('gender'),
            hearAbout: formData.get('hearAbout'),
            background: formData.get('background'),
            experience: formData.get('experience'),
            goals: formData.get('goals'),
            timestamp: new Date().toISOString()
        };
        
        try {
            // Submit to Google Apps Script
            // Note: Using no-cors mode because Google Apps Script Web Apps require it
            // The submission will succeed even if we can't read the response
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            // With no-cors, we can't read the response, but the submission should succeed
            // Show success message after a brief delay to ensure submission processed
            setTimeout(() => {
                showMessage('Application submitted successfully! We\'ll be in touch soon.', 'success');
                
                // Reset form after showing success message
                setTimeout(() => {
                    form.reset();
                    hideMessage();
                }, 5000);
            }, 500);
            
        } catch (error) {
            console.error('Form submission error:', error);
            showMessage('There was an error submitting your application. Please check your connection and try again, or contact us directly at agarwal.ujjwal@gmail.com', 'error');
        } finally {
            // Re-enable submit button after a delay
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }, 1000);
        }
    });
    
    // Handle clear form button
    const clearBtn = form.querySelector('button[type="reset"]');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all form data?')) {
                hideMessage();
            } else {
                // Prevent default reset
                clearBtn.type = 'button';
                setTimeout(() => {
                    clearBtn.type = 'reset';
                }, 0);
            }
        });
    }
});
