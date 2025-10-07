/**
 * Modal Components for Admin Panel
 * Handles modals for editing, deleting, and confirmations
 */
class AdminModal {
    constructor(modalId) {
        this.modalId = modalId;
        this.element = document.getElementById(modalId);
        this.isOpen = false;
        this.onCloseCallback = null;
        
        if (!this.element) {
            console.error(`Modal with id "${modalId}" not found`);
            return;
        }

        this.init();
    }

    init() {
        // Close button functionality
        const closeBtns = this.element.querySelectorAll('.modal-close, .modal-cancel');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.close());
        });

        // Close on background click
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) {
                this.close();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Prevent body scroll when modal is open
        this.element.addEventListener('transitionend', () => {
            if (this.isOpen) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
    }

    open() {
        if (!this.element) return;
        
        this.isOpen = true;
        this.element.classList.remove('hidden');
        
        // Focus management
        setTimeout(() => {
            const focusableElement = this.element.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElement) {
                focusableElement.focus();
            }
        }, 100);

        // Emit open event
        const event = new CustomEvent('adminModalOpen', {
            detail: { modalId: this.modalId }
        });
        document.dispatchEvent(event);
    }

    close() {
        if (!this.element) return;
        
        this.isOpen = false;
        this.element.classList.add('hidden');
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Execute callback if provided
        if (this.onCloseCallback) {
            this.onCloseCallback();
        }

        // Emit close event
        const event = new CustomEvent('adminModalClose', {
            detail: { modalId: this.modalId }
        });
        document.dispatchEvent(event);
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    setOnClose(callback) {
        this.onCloseCallback = callback;
    }

    updateContent(content) {
        const modalBody = this.element.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = content;
        }
    }

    updateTitle(title) {
        const modalTitle = this.element.querySelector('.modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = title;
        }
    }

    reset() {
        const forms = this.element.querySelectorAll('form');
        forms.forEach(form => form.reset());
        
        // Clear any error messages
        const errorMessages = this.element.querySelectorAll('.field-error');
        errorMessages.forEach(msg => msg.remove());
        
        // Remove error classes
        const errorFields = this.element.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));
    }

    destroy() {
        if (this.element) {
            this.element.remove();
        }
    }
}

// Edit Entry Modal
class EditEntryModal extends AdminModal {
    constructor() {
        super('editEntryModal');
        this.form = document.getElementById('editEntryForm');
        this.currentData = null;
        
        this.initForm();
    }

    initForm() {
        if (!this.form) return;

        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });

        // Image preview
        const imageInput = document.getElementById('editWebImage');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.handleImageChange(e));
        }

        // Remove image button
        const removeImageBtn = document.getElementById('removeEditImage');
        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', () => this.removeImage());
        }
    }

    async openWithData(data) {
        this.currentData = data;
        this.populateForm(data);
        this.open();
    }

    populateForm(data) {
        const fields = {
            'editSheetName': data.sheetName,
            'editRowSerial': data.serial,
            'editWebName': data.name,
            'editWebCategory': data.category,
            'editWebUrl': data.url,
            'editWebDescription': data.description
        };

        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = value || '';
            }
        });

        // Show current image if exists
        if (data.image) {
            this.showImagePreview(data.image);
        }
    }

    async handleSubmit() {
        if (!this.form) return;

        const formData = new FormData(this.form);
        const data = {
            sheetName: formData.get('sheetName'),
            rowSerial: formData.get('rowSerial'),
            name: formData.get('name'),
            category: formData.get('category'),
            url: formData.get('url'),
            description: formData.get('description')
        };

        // Add image file if selected
        const imageFile = formData.get('image');
        if (imageFile && imageFile.size > 0) {
            data.imageFile = imageFile;
        }

        // Validate form
        const validation = window.Validators.validateEntryForm(data);
        if (!validation.valid) {
            window.Validators.showFieldErrors(validation.errors, this.form);
            return;
        }

        try {
            // Show progress
            this.showUploadProgress(true);
            
            // Create form data for API
            const apiFormData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (key !== 'imageFile') {
                    apiFormData.append(key, value);
                }
            });
            
            if (data.imageFile) {
                apiFormData.append('image', data.imageFile);
                
                // Simulate upload progress
                this.simulateUploadProgress(() => {
                    this.completeUpdate(apiFormData);
                });
            } else {
                this.completeUpdate(apiFormData);
            }
        } catch (error) {
            this.showUploadProgress(false);
            window.showToast(window.adminAPI.handleError(error, 'Failed to update entry'), 'error');
        }
    }

    async completeUpdate(formData) {
        try {
            const response = await window.adminAPI.updateEntry(formData);
            
            if (response.success) {
                window.showToast('Entry updated successfully!', 'success');
                this.close();
                window.adminApp.refreshCurrentView();
            } else {
                throw new Error(response.message || 'Failed to update entry');
            }
        } catch (error) {
            window.showToast(window.adminAPI.handleError(error, 'Failed to update entry'), 'error');
        } finally {
            this.showUploadProgress(false);
        }
    }

    handleImageChange(e) {
        const file = e.target.files[0];
        if (file) {
            const validation = window.Validators.validateImageFile(file);
            if (!validation.valid) {
                window.showToast(validation.message, 'error');
                e.target.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                this.showImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    showImagePreview(imageSrc) {
        const preview = document.getElementById('editImagePreview');
        const previewImg = preview.querySelector('.preview-img');
        
        if (preview && previewImg) {
            previewImg.src = imageSrc;
            preview.classList.remove('hidden');
        }
    }

    removeImage() {
        const preview = document.getElementById('editImagePreview');
        const imageInput = document.getElementById('editWebImage');
        
        if (preview) {
            preview.classList.add('hidden');
        }
        
        if (imageInput) {
            imageInput.value = '';
        }
    }

    showUploadProgress(show) {
        const progressContainer = document.getElementById('editUploadProgress');
        if (progressContainer) {
            progressContainer.classList.toggle('hidden', !show);
        }
    }

    simulateUploadProgress(callback) {
        const progressFill = document.getElementById('editProgressFill');
        const progressText = document.getElementById('editProgressText');
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 90) {
                progress = 90;
                clearInterval(interval);
                setTimeout(callback, 200);
            }
            
            if (progressFill) {
                progressFill.style.width = `${progress}%`;
            }
            if (progressText) {
                progressText.textContent = `Uploading... ${Math.round(progress)}%`;
            }
        }, 100);
    }
}

// Delete Confirmation Modal
class DeleteModal extends AdminModal {
    constructor() {
        super('deleteModal');
        this.confirmBtn = document.getElementById('confirmDelete');
        this.deleteCallback = null;
        
        this.initDeleteButton();
    }

    initDeleteButton() {
        if (this.confirmBtn) {
            this.confirmBtn.addEventListener('click', () => {
                if (this.deleteCallback) {
                    this.deleteCallback();
                }
                this.close();
            });
        }
    }

    openWithCallback(message, callback) {
        const modalMessage = this.element.querySelector('.modal-body p');
        if (modalMessage) {
            modalMessage.textContent = message;
        }
        
        this.deleteCallback = callback;
        this.open();
    }
}

// Logout Confirmation Modal
class LogoutModal extends AdminModal {
    constructor() {
        super('logoutModal');
        this.confirmBtn = document.getElementById('confirmLogout');
        
        this.initLogoutButton();
    }

    initLogoutButton() {
        if (this.confirmBtn) {
            this.confirmBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    async handleLogout() {
        try {
            await window.adminAPI.logout();
            window.showToast('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = '../user/';
            }, 1000);
        } catch (error) {
            window.showToast(window.adminAPI.handleError(error, 'Logout failed'), 'error');
        }
    }
}

// Modal Manager
class AdminModalManager {
    constructor() {
        this.modals = new Map();
        this.init();
    }

    init() {
        // Initialize modals
        this.modals.set('editEntry', new EditEntryModal());
        this.modals.set('delete', new DeleteModal());
        this.modals.set('logout', new LogoutModal());
    }

    getModal(name) {
        return this.modals.get(name);
    }

    openModal(name) {
        const modal = this.modals.get(name);
        if (modal) {
            modal.open();
        }
    }

    closeModal(name) {
        const modal = this.modals.get(name);
        if (modal) {
            modal.close();
        }
    }

    closeAll() {
        this.modals.forEach(modal => modal.close());
    }
}

// Create global modal manager
window.adminModalManager = new AdminModalManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdminModal, EditEntryModal, DeleteModal, LogoutModal, AdminModalManager };
}