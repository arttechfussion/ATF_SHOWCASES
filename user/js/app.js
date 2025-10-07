/**
 * Main Application for User Showcase
 * Coordinates all components and handles application logic
 */
class UserApp {
    constructor() {
        this.components = {};
        this.currentPage = 1;
        this.isLoading = false;
        this.entries = [];
        this.totalEntries = 0;
        
        this.init();
    }

    async init() {
        try {
            // Show loading state
            this.showLoading(true);
            
            // Initialize configuration
            await window.AppConfig.load();
            
            // Initialize components
            this.initComponents();
            
            // Load initial data
            await this.loadInitialData();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Hide loading state
            this.showLoading(false);
            
            console.log('User Showcase initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to load application. Please refresh the page.');
        }
    }

    initComponents() {
        // Initialize filters
        this.components.filters = new Filters({
            onFiltersChange: (filters) => this.handleFiltersChange(filters)
        });

        // Initialize pagination
        this.components.pagination = new Pagination('pagination', {
            itemsPerPage: 12,
            onPageChange: (page) => this.handlePageChange(page)
        });

        // Modals are initialized by ModalManager
        this.components.loginModal = window.modalManager.getModal('login');
        this.components.detailModal = window.modalManager.getModal('detail');
    }

    async loadInitialData() {
        await this.loadEntries();
    }

    async loadEntries() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);

        try {
            const filters = this.components.filters.getAPIParams();
            const params = {
                page: this.currentPage,
                size: 12,
                ...filters
            };

            const response = await window.userAPI.getPublicEntries(params);
            
            if (response.success) {
                this.entries = response.data.entries || [];
                this.totalEntries = response.data.total || 0;
                const totalPages = Math.ceil(this.totalEntries / 12);
                
                this.renderEntries();
                this.components.pagination.update(this.currentPage, totalPages, this.totalEntries);
                
                // Show empty state if no entries
                if (this.entries.length === 0) {
                    this.showEmptyState(true);
                } else {
                    this.showEmptyState(false);
                }
            } else {
                throw new Error(response.message || 'Failed to load entries');
            }
        } catch (error) {
            console.error('Failed to load entries:', error);
            this.showError(window.userAPI.handleError(error, 'Failed to load websites'));
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    renderEntries() {
        const container = document.getElementById('cardsGrid');
        if (!container) return;

        const cards = window.CardFactory.createCards(this.entries);
        window.CardFactory.renderCards(container, cards);
    }

    handleFiltersChange(filters) {
        // Reset to first page when filters change
        this.currentPage = 1;
        this.loadEntries();
    }

    handlePageChange(page) {
        this.currentPage = page;
        this.loadEntries();
        
        // Scroll to top of cards
        const cardsGrid = document.getElementById('cardsGrid');
        if (cardsGrid) {
            cardsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    setupEventListeners() {
        // Admin login button
        const adminLoginBtn = document.getElementById('adminLoginBtn');
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', () => {
                this.components.loginModal.open();
            });
        }

        // Card click events (handled by event delegation)
        document.addEventListener('cardClick', (e) => {
            this.handleCardClick(e.detail);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search focus
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('search');
                if (searchInput) {
                    searchInput.focus();
                }
            }
            
            // Escape to clear filters
            if (e.key === 'Escape' && this.components.filters.hasActiveFilters()) {
                this.components.filters.clearAllFilters();
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.filters) {
                this.components.filters.setFilters(e.state.filters);
            }
        });
    }

    handleCardClick(cardData) {
        this.components.detailModal.showWebsiteData(cardData);
    }

    showLoading(show) {
        const loadingState = document.getElementById('loadingState');
        const cardsGrid = document.getElementById('cardsGrid');
        
        if (loadingState) {
            loadingState.classList.toggle('hidden', !show);
        }
        
        if (cardsGrid) {
            cardsGrid.style.opacity = show ? '0.5' : '1';
        }
    }

    showEmptyState(show) {
        const emptyState = document.getElementById('emptyState');
        const cardsGrid = document.getElementById('cardsGrid');
        
        if (emptyState) {
            emptyState.classList.toggle('hidden', !show);
        }
        
        if (cardsGrid) {
            cardsGrid.classList.toggle('hidden', show);
        }
    }

    showError(message) {
        window.showToast(message, 'error');
    }

    // Utility methods
    refresh() {
        this.currentPage = 1;
        this.loadEntries();
    }

    // Method to handle URL parameters for sharing filtered views
    updateURL() {
        const filters = this.components.filters.getFilters();
        const params = new URLSearchParams();
        
        if (filters.search) params.set('search', filters.search);
        if (filters.date) params.set('date', filters.date);
        if (filters.category) params.set('category', filters.category);
        if (this.currentPage > 1) params.set('page', this.currentPage.toString());
        
        const url = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
        window.history.replaceState({ filters }, '', url);
    }

    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        const filters = {};
        
        if (params.has('search')) filters.search = params.get('search');
        if (params.has('date')) filters.date = params.get('date');
        if (params.has('category')) filters.category = params.get('category');
        if (params.has('page')) this.currentPage = parseInt(params.get('page'), 10) || 1;
        
        if (Object.keys(filters).length > 0) {
            this.components.filters.setFilters(filters);
        }
    }

    destroy() {
        // Clean up components
        if (this.components.filters) {
            this.components.filters.destroy();
        }
        
        if (this.components.pagination) {
            this.components.pagination.destroy();
        }
        
        // Clear event listeners
        document.removeEventListener('cardClick', this.handleCardClick);
    }
}

// Toast notification utility
window.showToast = function(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.userApp = new UserApp();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.userApp) {
        // Refresh data when page becomes visible again
        window.userApp.refresh();
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserApp;
}