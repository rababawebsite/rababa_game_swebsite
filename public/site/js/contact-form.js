// Contact Form Handler with Validation
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    const submitButton = form.querySelector('button[type="submit"]');
    const msgSubmit = document.getElementById('msgSubmit');

    const getApiBase = () => {
        if (typeof window.RABABA_API_BASE === 'string' && window.RABABA_API_BASE.trim() !== '') {
            return window.RABABA_API_BASE.replace(/\/$/, '');
        }
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5000';
        }
        return 'https://rababa-game-swebsite-79cg.vercel.app';
    };

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Input sanitization function
    function sanitizeInput(input) {
        return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    // Show error message
    function showError(field, message) {
        const errorDiv = field.parentNode.querySelector('.help-block');
        errorDiv.textContent = message;
        errorDiv.style.color = '#dc3545';
        field.style.borderColor = '#dc3545';
    }

    // Clear error message
    function clearError(field) {
        const errorDiv = field.parentNode.querySelector('.help-block');
        errorDiv.textContent = '';
        field.style.borderColor = '';
    }

    // Validate individual field
    function validateField(field) {
        const value = sanitizeInput(field.value);
        let isValid = true;

        clearError(field);

        switch(field.id) {
            case 'name':
                if (!value || value.length < 2) {
                    showError(field, 'Name must be at least 2 characters long');
                    isValid = false;
                } else if (value.length > 50) {
                    showError(field, 'Name must be less than 50 characters');
                    isValid = false;
                } else if (!/^[a-zA-Z\s\-']+$/.test(value)) {
                    showError(field, 'Name can only contain letters, spaces, hyphens, and apostrophes');
                    isValid = false;
                }
                break;

            case 'email':
                if (!value) {
                    showError(field, 'Email is required');
                    isValid = false;
                } else if (!emailRegex.test(value)) {
                    showError(field, 'Please enter a valid email address');
                    isValid = false;
                } else if (value.length > 254) {
                    showError(field, 'Email address is too long');
                    isValid = false;
                }
                break;

            case 'message':
                if (!value) {
                    showError(field, 'Message is required');
                    isValid = false;
                } else if (value.length < 10) {
                    showError(field, 'Message must be at least 10 characters long');
                    isValid = false;
                } else if (value.length > 1000) {
                    showError(field, 'Message must be less than 1000 characters');
                    isValid = false;
                }
                break;
        }

        return isValid;
    }

    // Add real-time validation
    ['name', 'email', 'message'].forEach(fieldId => {
        const field = document.getElementById(fieldId);
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
            if (field.style.borderColor === 'rgb(220, 53, 69)') {
                validateField(field);
            }
        });
    });

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validate all fields
        const nameField = document.getElementById('name');
        const emailField = document.getElementById('email');
        const messageField = document.getElementById('message');

        const isNameValid = validateField(nameField);
        const isEmailValid = validateField(emailField);
        const isMessageValid = validateField(messageField);

        if (!isNameValid || !isEmailValid || !isMessageValid) {
            return;
        }

        // Disable submit button and show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';

        try {
            const payload = {
                name: sanitizeInput(nameField.value),
                email: sanitizeInput(emailField.value),
                message: sanitizeInput(messageField.value),
                sourcePage: window.location.href,
            };

            // Submit form
            const response = await fetch(`${getApiBase()}/api/contact`, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                // Show success message
                msgSubmit.className = 'text-center success-message';
                msgSubmit.textContent = result.message || 'Thank you! Your message has been sent successfully.';
                msgSubmit.style.color = '#28a745';
                
                // Reset form
                form.reset();
                
                // Clear any remaining error states
                [nameField, emailField, messageField].forEach(field => {
                    clearError(field);
                });

            } else {
                // Show error message
                msgSubmit.className = 'text-center error-message';
                msgSubmit.textContent = result.message || 'Sorry, there was an error sending your message. Please try again.';
                msgSubmit.style.color = '#dc3545';
            }

        } catch (error) {
            console.error('Form submission error:', error);
            msgSubmit.className = 'text-center error-message';
            msgSubmit.textContent = 'Sorry, there was a network error. Please try again later.';
            msgSubmit.style.color = '#dc3545';

        } finally {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.textContent = 'Send Message';
            
            // Show message
            msgSubmit.classList.remove('hidden');
            
            // Hide message after 5 seconds
            setTimeout(() => {
                msgSubmit.classList.add('hidden');
            }, 5000);
        }
    });

});