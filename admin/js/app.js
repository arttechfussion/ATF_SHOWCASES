/**
 * Main Application for Admin Panel
 * Coordinates all components and handles application logic
 */
class AdminApp {
    constructor() {
        this.components = {};
        this.currentView = 'dashboard';
        this.currentPage = 1;
        this.isLoading = false;
        this.entries = [];
        this.categories = [];
        this.totalEntries = 0;
        
        this.init();
    }

    async init() {
        try {
            // Check authentication
            if (!this.isAuthenticated()) {
                window.location.href = '../user/';
                return;
            }
            
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
            
            console.log('Admin Panel initialized successfully');
        } catch (error) {
            console.error('Failed to initialize admin app:', error);
            this.showError('Failed to load admin panel. Please refresh the page.');
        }
    }

    isAuthenticated() {
        const token = sessionStorage.getItem('adminToken');
        const expiresAt = sessionStorage.getItem('tokenExpires');
        
        if (!token || !expiresAt) {
            return false;
        }
        
        return new Date() < new Date(expiresAt);
    }

    initComponents() {
        // Initialize filters for web list
        this.components.webFilters = new AdminFilters({
            onFiltersChange: (filters) => this.handleWebFiltersChange(filters)
        });

        // Initialize pagination for web list
        this.components.webPagination = new AdminPagination('webPagination', {
            itemsPerPage: 12,
            onPageChange: (page) => this.handleWebPageChange(page)
        });

        // Initialize chart for dashboard
        this.components.categoryChart = new CategoryChart('categoryChart');

        // Modals are initialized by AdminModalManager
        this.components.editModal = window.adminModalManager.getModal('editEntry');
        this.components.deleteModal = window.adminModalManager.getModal('delete');
        this.components.logoutModal = window.adminModalManager.getModal('logout');
    }

    async loadInitialData() {
        await Promise.all([
            this.loadCategories(),
            this.loadDashboardStats()
        ]);
    }

    async loadCategories() {
        try {
            const response = await window.adminAPI.getCategories();
            if (response.success && response.data) {
                this.categories = response.data;
                this.updateCategoryDropdowns();
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    async loadDashboardStats() {
        try {
            const [entriesResponse, categoriesResponse] = await Promise.all([
                window.adminAPI.getEntries(),
                window.adminAPI.getCategories()
            ]);

            if (entriesResponse.success) {
                this.updateDashboardStats(entriesResponse.data.total || 0, categoriesResponse.data?.length || 0);
                this.updateCategoryChart(entriesResponse.data.entries || []);
            }
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        }
    }

    async loadEntries() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showWebLoading(true);

        try {
            const filters = this.components.webFilters.getAPIParams();
            const params = {
                page: this.currentPage,
                size: 12,
                ...filters
            };

            const response = await window.adminAPI.getEntries(params);
            
            if (response.success) {
                this.entries = response.data.entries || [];
                this.totalEntries = response.data.total || 0;
                const totalPages = Math.ceil(this.totalEntries / 12);
                
                this.renderWebEntries();
                this.components.webPagination.update(this.currentPage, totalPages, this.totalEntries);
                
                // Show empty state if no entries
                if (this.entries.length === 0) {
                    this.showWebEmptyState(true);
                } else {
                    this.showWebEmptyState(false);
                }
            } else {
                throw new Error(response.message || 'Failed to load entries');
            }
        } catch (error) {
            console.error('Failed to load entries:', error);
            this.showError(window.adminAPI.handleError(error, 'Failed to load websites'));
        } finally {
            this.isLoading = false;
            this.showWebLoading(false);
        }
    }

    setupEventListeners() {
        // Navigation
        const navButtons = document.querySelectorAll('.nav-btn[data-view]');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('collapsed');
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.components.logoutModal.open();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshCurrentView();
            });
        }

        // Add Entry Form
        const addEntryForm = document.getElementById('addEntryForm');
        if (addEntryForm) {
            addEntryForm.addEventListener('submit', (e) => {
                this.handleAddEntry(e);
            });
        }

        // Add Category Form
        const addCategoryForm = document.getElementById('addCategoryForm');
        if (addCategoryForm) {
            addCategoryForm.addEventListener('submit', (e) => {
                this.handleAddCategory(e);
            });
        }

        // Image preview for add entry
        const addImageInput = document.getElementById('webImage');
        if (addImageInput) {
            addImageInput.addEventListener('change', (e) => {
                this.handleImagePreview(e, 'imagePreview');
            });
        }

        // Remove image button for add entry
        const removeImageBtn = document.getElementById('removeImage');
        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', () => {
                this.removeImagePreview('imagePreview', 'webImage');
            });
        }

        // Reset form buttons
        const resetEntryBtn = document.getElementById('resetEntryForm');
        if (resetEntryBtn) {
            resetEntryBtn.addEventListener('click', () => {
                this.resetAddEntryForm();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N for new entry
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.switchView('addEntry');
            }
            
            // Ctrl/Cmd + D for dashboard
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.switchView('dashboard');
            }
        });
    }

    switchView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}View`).classList.add('active');

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            webList: 'Web List',
            addEntry: 'Add Entry',
            addCategory: 'Add Category'
        };
        document.getElementById('viewTitle').textContent = titles[viewName];

        this.currentView = viewName;

        // Load view-specific data
        if (viewName === 'webList') {
            this.loadEntries();
        } else if (viewName === 'dashboard') {
            this.loadDashboardStats();
        } else if (viewName === 'addCategory') {
            this.renderCategoriesList();
        }
    }

    async handleAddEntry(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
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
            window.Validators.showFieldErrors(validation.errors, e.target);
            return;
        }

        try {
            // Show progress
            this.showUploadProgress(true);
            
            // Create form data for API
            const apiFormData = new FormData();
            Object.entries(validation.data).forEach(([key, value]) => {
                if (key !== 'imageFile') {
                    apiFormData.append(key, value);
                }
            });
            
            if (data.imageFile) {
                apiFormData.append('image', data.imageFile);
                
                // Simulate upload progress
                this.simulateUploadProgress(() => {
                    this.completeAddEntry(apiFormData);
                });
            } else {
                this.completeAddEntry(apiFormData);
            }
        } catch (error) {
            this.showUploadProgress(false);
            window.showToast(window.adminAPI.handleError(error, 'Failed to add entry'), 'error');
        }
    }

    async completeAddEntry(formData) {
        try {
            const response = await window.adminAPI.createEntry(formData);
            
            if (response.success) {
                window.showToast('Entry added successfully!', 'success');
                this.resetAddEntryForm();
                this.switchView('webList');
            } else {
                throw new Error(response.message || 'Failed to add entry');
            }
        } catch (error) {
            window.showToast(window.adminAPI.handleError(error, 'Failed to add entry'), 'error');
        } finally {
            this.showUploadProgress(false);
        }
    }

    async handleAddCategory(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name')
        };

        // Validate form
        const validation = window.Validators.validateCategoryForm(data);
        if (!validation.valid) {
            window.Validators.showFieldErrors(validation.errors, e.target);
            return;
        }

        try {
            const response = await window.adminAPI.createCategory(data.name);
            
            if (response.success) {
                window.showToast('Category added successfully!', 'success');
                e.target.reset();
                await this.loadCategories();
                this.renderCategoriesList();
            } else {
                throw new Error(response.message || 'Failed to add category');
            }
        } catch (error) {
            window.showToast(window.adminAPI.handleError(error, 'Failed to add category'), 'error');
        }
    }

    handleEditEntry(sheetName, serial) {
        const entry = this.entries.find(e => e.sheetName === sheetName && e.serial === serial);
        if (entry) {
            this.components.editModal.openWithData(entry);
        }
    }

    handleDeleteEntry(sheetName, serial, imageFileId) {
        const entry = this.entries.find(e => e.sheetName === sheetName && e.serial === serial);
        if (!entry) return;

        const message = `Are you sure you want to delete "${entry.name}"? This action cannot be undone.`;
        
        this.components.deleteModal.openWithCallback(message, async () => {
            try {
                const response = await window.adminAPI.deleteEntry(sheetName, serial, imageFileId);
                
                if (response.success) {
                    window.showToast('Entry deleted successfully!', 'success');
                    this.loadEntries();
                } else {
                    throw new Error(response.message || 'Failed to delete entry');
                }
            } catch (error) {
                window.showToast(window.adminAPI.handleError(error, 'Failed to delete entry'), 'error');
            }
        });
    }

    handleEditCategory(categoryName) {
        const newName = prompt('Enter new category name:', categoryName);
        if (newName && newName !== categoryName) {
            this.updateCategory(categoryName, newName);
        }
    }

    handleDeleteCategory(categoryName) {
        const message = `Are you sure you want to delete category "${categoryName}"? This will also delete all entries in this category.`;
        
        this.components.deleteModal.openWithCallback(message, async () => {
            try {
                const response = await window.adminAPI.deleteCategory(categoryName);
                
                if (response.success) {
                    window.showToast('Category deleted successfully!', 'success');
                    await this.loadCategories();
                    this.renderCategoriesList();
                } else {
                    throw new Error(response.message || 'Failed to delete category');
                }
            } catch (error) {
                window.showToast(window.adminAPI.handleError(error, 'Failed to delete category'), 'error');
            }
        });
    }

    async updateCategory(originalName, newName) {
        try {
            const response = await window.adminAPI.updateCategory(originalName, newName);
            
            if (response.success) {
                window.showToast('Category updated successfully!', 'success');
                await this.loadCategories();
                this.renderCategoriesList();
            } else {
                throw new Error(response.message || 'Failed to update category');
            }
        } catch (error) {
            window.showToast(window.adminAPI.handleError(error, 'Failed to update category'), 'error');
        }
    }

    handleWebFiltersChange(filters) {
        // Reset to first page when filters change
        this.currentPage = 1;
        this.loadEntries();
    }

    handleWebPageChange(page) {
        this.currentPage = page;
        this.loadEntries();
        
        // Scroll to top of cards
        const cardsGrid = document.getElementById('webCardsGrid');
        if (cardsGrid) {
            cardsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    handleImagePreview(e, previewId) {
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
                this.showImagePreview(e.target.result, previewId);
            };
            reader.readAsDataURL(file);
        }
    }

    showImagePreview(imageSrc, previewId) {
        const preview = document.getElementById(previewId);
        const previewImg = preview.querySelector('.preview-img');
        
        if (preview && previewImg) {
            previewImg.src = imageSrc;
            preview.classList.remove('hidden');
        }
    }

    removeImagePreview(previewId, inputId) {
        const preview = document.getElementById(previewId);
        const imageInput = document.getElementById(inputId);
        
        if (preview) {
            preview.classList.add('hidden');
        }
        
        if (imageInput) {
            imageInput.value = '';
        }
    }

    showUploadProgress(show) {
        const progressContainer = document.getElementById('uploadProgress');
        if (progressContainer) {
            progressContainer.classList.toggle('hidden', !show);
        }
    }

    simulateUploadProgress(callback) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
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

    // Rendering methods
    renderWebEntries() {
        const container = document.getElementById('webCardsGrid');
        if (!container) return;

        const cards = window.AdminCardFactory.createCards(this.entries);
        window.AdminCardFactory.renderCards(container, cards);
    }

    renderCategoriesList() {
        const container = document.getElementById('categoriesTable');
        if (!container) return;

        const categoryItems = window.CategoryItemFactory.createCategoryItems(this.categories);
        window.CategoryItemFactory.renderCategoryItems(container, categoryItems);
    }

    updateCategoryDropdowns() {
        // Update add entry form
        const addCategorySelect = document.getElementById('webCategory');
        if (addCategorySelect) {
            this.populateCategorySelect(addCategorySelect);
        }

        // Update edit entry form
        const editCategorySelect = document.getElementById('editWebCategory');
        if (editCategorySelect) {
            this.populateCategorySelect(editCategorySelect);
        }

        // Update web filters
        if (this.components.webFilters) {
            this.components.webFilters.updateCategories(this.categories);
        }
    }

    populateCategorySelect(selectElement) {
        // Clear existing options (except the first one)
        while (selectElement.children.length > 1) {
            selectElement.removeChild(selectElement.lastChild);
        }

        // Add category options
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            selectElement.appendChild(option);
        });
    }

    updateDashboardStats(totalWebsites, totalCategories) {
        const totalWebsitesEl = document.getElementById('totalWebsites');
        const totalCategoriesEl = document.getElementById('totalCategories');
        
        if (totalWebsitesEl) {
            this.animateNumber(totalWebsitesEl, totalWebsites);
        }
        
        if (totalCategoriesEl) {
            this.animateNumber(totalCategoriesEl, totalCategories);
        }
    }

    updateCategoryChart(entries) {
        if (!this.components.categoryChart) return;

        // Count entries per category
        const categoryCounts = {};
        entries.forEach(entry => {
            const category = entry.category || 'Uncategorized';
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        // Convert to chart data format
        const chartData = Object.entries(categoryCounts).map(([name, count]) => ({
            name,
            count
        }));

        this.components.categoryChart.setData(chartData);
    }

    animateNumber(element, target) {
        const start = parseInt(element.textContent) || 0;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.round(start + (target - start) * progress);
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    // UI state methods
    showLoading(show) {
        // Could add a global loading overlay here
    }

    showWebLoading(show) {
        const loadingState = document.getElementById('webLoadingState');
        const cardsGrid = document.getElementById('webCardsGrid');
        
        if (loadingState) {
            loadingState.classList.toggle('hidden', !show);
        }
        
        if (cardsGrid) {
            cardsGrid.style.opacity = show ? '0.5' : '1';
        }
    }

    showWebEmptyState(show) {
        const emptyState = document.getElementById('webEmptyState');
        const cardsGrid = document.getElementById('webCardsGrid');
        
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
    resetAddEntryForm() {
        const form = document.getElementById('addEntryForm');
        if (form) {
            form.reset();
            window.Validators.clearFieldErrors(form);
        }
        
        // Clear image preview
        this.removeImagePreview('imagePreview', 'webImage');
        
        // Hide progress
        this.showUploadProgress(false);
    }

    refreshCurrentView() {
        switch (this.currentView) {
            case 'dashboard':
                this.loadDashboardStats();
                break;
            case 'webList':
                this.loadEntries();
                break;
            case 'addCategory':
                this.loadCategories();
                this.renderCategoriesList();
                break;
        }
        
        window.showToast('Data refreshed', 'success');
    }

    destroy() {
        // Clean up components
        if (this.components.webFilters) {
            this.components.webFilters.destroy();
        }
        
        if (this.components.webPagination) {
            this.components.webPagination.destroy();
        }
        
        if (this.components.categoryChart) {
            this.components.categoryChart.destroy();
        }
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

// Add CSS for field errors
const errorStyles = `
    .field-error {
        color: var(--error-color);
        font-size: var(--font-size-xs);
        margin-top: var(--spacing-1);
    }
    
    .error {
        border-color: var(--error-color) !important;
    }
    
    .error:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = errorStyles;
document.head.appendChild(styleSheet);

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.adminApp = new AdminApp();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.adminApp) {
        // Check authentication when page becomes visible
        if (!window.adminApp.isAuthenticated()) {
            window.location.href = '../user/';
        }
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminApp;
}