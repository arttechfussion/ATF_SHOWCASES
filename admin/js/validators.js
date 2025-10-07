/**
 * Form Validators for Admin Panel
 * Provides validation functions for various forms
 */
class Validators {
    // URL validation
    static validateUrl(url) {
        if (!url || url.trim() === '') {
            return { valid: false, message: 'URL is required' };
        }

        // Add https:// if missing
        let formattedUrl = url.trim();
        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
            formattedUrl = 'https://' + formattedUrl;
        }

        try {
            const urlObj = new URL(formattedUrl);
            
            // Check if domain is valid
            if (!urlObj.hostname || urlObj.hostname === '') {
                return { valid: false, message: 'Invalid URL format' };
            }

            // Check for valid TLD (basic check)
            const tldRegex = /\.[a-z]{2,}$/i;
            if (!tldRegex.test(urlObj.hostname)) {
                return { valid: false, message: 'URL must have a valid domain extension' };
            }

            return { valid: true, url: formattedUrl };
        } catch (error) {
            return { valid: false, message: 'Invalid URL format' };
        }
    }

    // Required field validation
    static validateRequired(value, fieldName) {
        if (!value || value.trim() === '') {
            return { valid: false, message: `${fieldName} is required` };
        }
        return { valid: true };
    }

    // Text length validation
    static validateLength(value, minLength, maxLength, fieldName) {
        const trimmedValue = value ? value.trim() : '';
        
        if (trimmedValue.length < minLength) {
            return { 
                valid: false, 
                message: `${fieldName} must be at least ${minLength} characters long` 
            };
        }
        
        if (trimmedValue.length > maxLength) {
            return { 
                valid: false, 
                message: `${fieldName} must not exceed ${maxLength} characters` 
            };
        }
        
        return { valid: true };
    }

    // Category name validation
    static validateCategoryName(name) {
        const requiredResult = this.validateRequired(name, 'Category name');
        if (!requiredResult.valid) return requiredResult;

        const lengthResult = this.validateLength(name, 2, 50, 'Category name');
        if (!lengthResult.valid) return lengthResult;

        // Check for valid characters (letters, numbers, spaces, hyphens, underscores)
        const validPattern = /^[a-zA-Z0-9\s\-_]+$/;
        if (!validPattern.test(name.trim())) {
            return { 
                valid: false, 
                message: 'Category name can only contain letters, numbers, spaces, hyphens, and underscores' 
            };
        }

        return { valid: true };
    }

    // Website name validation
    static validateWebsiteName(name) {
        const requiredResult = this.validateRequired(name, 'Website name');
        if (!requiredResult.valid) return requiredResult;

        const lengthResult = this.validateLength(name, 2, 100, 'Website name');
        if (!lengthResult.valid) return lengthResult;

        return { valid: true };
    }

    // Description validation
    static validateDescription(description) {
        const requiredResult = this.validateRequired(description, 'Description');
        if (!requiredResult.valid) return requiredResult;

        const lengthResult = this.validateLength(description, 10, 1000, 'Description');
        if (!lengthResult.valid) return lengthResult;

        return { valid: true };
    }

    // Image file validation
    static validateImageFile(file) {
        if (!file) {
            return { valid: true }; // Image is optional
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return { 
                valid: false, 
                message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed' 
            };
        }

        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            return { 
                valid: false, 
                message: 'Image file size must not exceed 5MB' 
            };
        }

        return { valid: true };
    }

    // Form validation for add/edit entry
    static validateEntryForm(formData) {
        const errors = [];

        // Validate website name
        const nameResult = this.validateWebsiteName(formData.name);
        if (!nameResult.valid) {
            errors.push({ field: 'name', message: nameResult.message });
        }

        // Validate category
        const categoryResult = this.validateRequired(formData.category, 'Category');
        if (!categoryResult.valid) {
            errors.push({ field: 'category', message: categoryResult.message });
        }

        // Validate URL
        const urlResult = this.validateUrl(formData.url);
        if (!urlResult.valid) {
            errors.push({ field: 'url', message: urlResult.message });
        }

        // Validate description
        const descriptionResult = this.validateDescription(formData.description);
        if (!descriptionResult.valid) {
            errors.push({ field: 'description', message: descriptionResult.message });
        }

        // Validate image if provided
        if (formData.imageFile) {
            const imageResult = this.validateImageFile(formData.imageFile);
            if (!imageResult.valid) {
                errors.push({ field: 'image', message: imageResult.message });
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            data: urlResult.valid ? { ...formData, url: urlResult.url } : formData
        };
    }

    // Form validation for category form
    static validateCategoryForm(formData) {
        const errors = [];

        // Validate category name
        const nameResult = this.validateCategoryName(formData.name);
        if (!nameResult.valid) {
            errors.push({ field: 'name', message: nameResult.message });
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Login form validation
    static validateLoginForm(formData) {
        const errors = [];

        // Validate username
        const usernameResult = this.validateRequired(formData.username, 'Username');
        if (!usernameResult.valid) {
            errors.push({ field: 'username', message: usernameResult.message });
        }

        // Validate password
        const passwordResult = this.validateRequired(formData.password, 'Password');
        if (!passwordResult.valid) {
            errors.push({ field: 'password', message: passwordResult.message });
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Search validation (for admin - minimum 3 characters)
    static validateSearchQuery(query) {
        if (!query || query.trim() === '') {
            return { valid: true }; // Empty search is allowed
        }

        const trimmedQuery = query.trim();
        if (trimmedQuery.length < 3) {
            return { 
                valid: false, 
                message: 'Search query must be at least 3 characters long' 
            };
        }

        if (trimmedQuery.length > 100) {
            return { 
                valid: false, 
                message: 'Search query must not exceed 100 characters' 
            };
        }

        return { valid: true };
    }

    // Date validation
    static validateDate(dateString) {
        if (!dateString || dateString.trim() === '') {
            return { valid: true }; // Empty date is allowed
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return { valid: false, message: 'Invalid date format' };
        }

        // Check if date is not in the future (optional validation)
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        
        if (date > today) {
            return { valid: false, message: 'Date cannot be in the future' };
        }

        return { valid: true };
    }

    // Utility method to show field errors
    static showFieldErrors(errors, formElement) {
        // Clear previous errors
        this.clearFieldErrors(formElement);

        errors.forEach(error => {
            const field = formElement.querySelector(`[name="${error.field}"]`);
            if (field) {
                // Add error class to field
                field.classList.add('error');
                
                // Create or update error message
                let errorElement = field.parentNode.querySelector('.field-error');
                if (!errorElement) {
                    errorElement = document.createElement('span');
                    errorElement.className = 'field-error';
                    field.parentNode.appendChild(errorElement);
                }
                errorElement.textContent = error.message;
            }
        });
    }

    // Utility method to clear field errors
    static clearFieldErrors(formElement) {
        const fields = formElement.querySelectorAll('.error');
        fields.forEach(field => field.classList.remove('error'));

        const errorMessages = formElement.querySelectorAll('.field-error');
        errorMessages.forEach(msg => msg.remove());
    }

    // Utility method to check if form has changes
    static hasFormChanges(formData, originalData) {
        return Object.keys(formData).some(key => {
            const currentValue = formData[key];
            const originalValue = originalData[key];
            
            // Handle file inputs specially
            if (key === 'image' && currentValue instanceof File) {
                return true; // New file selected
            }
            
            return currentValue !== originalValue;
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validators;
}