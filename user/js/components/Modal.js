/**
 * Modal Component
 * Handles modal functionality for login and detail views
 */
class Modal {
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
        const closeBtn = this.element.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

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
        const event = new CustomEvent('modalOpen', {
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
        const event = new CustomEvent('modalClose', {
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

    destroy() {
        if (this.element) {
            this.element.remove();
        }
    }
}

// Login Modal Specific Handler
class LoginModal extends Modal {
    constructor() {
        super('loginModal');
        this.form = document.getElementById('loginForm');
        this.backLink = document.getElementById('backToShowcase');
        
        this.initLoginForm();
    }

    initLoginForm() {
        if (!this.form) return;

        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(this.form);
            const credentials = {
                username: formData.get('username'),
                password: formData.get('password')
            };

            try {
                // Show loading state
                const submitBtn = this.form.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.innerHTML = '<span class="spinner"></span> Logging in...';
                submitBtn.disabled = true;

                const response = await window.userAPI.login(credentials);
                
                if (response.success) {
                    // Store token
                    sessionStorage.setItem('adminToken', response.data.token);
                    sessionStorage.setItem('tokenExpires', response.data.expiresAt);
                    
                    // Show success message
                    window.showToast('Login successful! Redirecting...', 'success');
                    
                    // Redirect to admin
                    setTimeout(() => {
                        window.location.href = '../admin/';
                    }, 1500);
                } else {
                    window.showToast(response.message || 'Login failed', 'error');
                }
            } catch (error) {
                window.showToast(window.userAPI.handleError(error, 'Login failed'), 'error');
            } finally {
                // Reset button
                const submitBtn = this.form.querySelector('button[type="submit"]');
                submitBtn.textContent = 'Login';
                submitBtn.disabled = false;
            }
        });

        // Back to showcase link
        if (this.backLink) {
            this.backLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.close();
            });
        }
    }

    reset() {
        if (this.form) {
            this.form.reset();
        }
    }
}

// Detail Modal Specific Handler
class DetailModal extends Modal {
    constructor() {
        super('detailModal');
        this.currentData = null;
    }

    showWebsiteData(data) {
        this.currentData = data;
        
        // Update modal content
        const titleEl = document.getElementById('detailTitle');
        const imageEl = document.getElementById('detailImage');
        const categoryEl = document.getElementById('detailCategory');
        const dateEl = document.getElementById('detailDate');
        const descriptionEl = document.getElementById('detailDescription');
        const urlEl = document.getElementById('detailUrl');

        if (titleEl) titleEl.textContent = data.name;
        if (imageEl) {
            imageEl.src = data.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Ctext x="200" y="150" text-anchor="middle" fill="%23999" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';
            imageEl.alt = data.name;
        }
        if (categoryEl) categoryEl.textContent = data.category;
        if (dateEl) dateEl.textContent = this.formatDate(data.date, data.time);
        if (descriptionEl) descriptionEl.textContent = data.description;
        if (urlEl) {
            urlEl.href = data.url;
            urlEl.textContent = 'Visit Website';
        }

        this.open();
    }

    formatDate(date, time) {
        if (!date) return '';
        
        try {
            const dateObj = new Date(date + ' ' + (time || ''));
            return dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return date;
        }
    }
}

// Modal Manager
class ModalManager {
    constructor() {
        this.modals = new Map();
        this.init();
    }

    init() {
        // Initialize login modal
        this.modals.set('login', new LoginModal());
        
        // Initialize detail modal
        this.modals.set('detail', new DetailModal());
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
window.modalManager = new ModalManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Modal, LoginModal, DetailModal, ModalManager };
}