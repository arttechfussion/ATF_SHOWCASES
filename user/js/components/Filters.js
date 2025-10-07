/**
 * Filters Component
 * Handles search, date, and category filters
 */
class Filters {
    constructor(options = {}) {
        this.searchInput = document.getElementById('search');
        this.dateFilter = document.getElementById('dateFilter');
        this.categoryFilter = document.getElementById('categoryFilter');
        this.clearBtn = document.getElementById('clearFilters');
        
        this.onFiltersChange = options.onFiltersChange || null;
        this.searchDebounceTime = options.searchDebounceTime || 250;
        this.searchDebounceTimer = null;
        
        this.filters = {
            search: '',
            date: '',
            category: ''
        };
        
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.loadCategories();
    }

    attachEventListeners() {
        // Search input with debouncing
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchDebounceTimer);
                this.searchDebounceTimer = setTimeout(() => {
                    this.handleSearchChange(e.target.value);
                }, this.searchDebounceTime);
            });

            // Handle Enter key
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    clearTimeout(this.searchDebounceTimer);
                    this.handleSearchChange(e.target.value);
                }
            });
        }

        // Date filter
        if (this.dateFilter) {
            this.dateFilter.addEventListener('change', (e) => {
                this.handleDateChange(e.target.value);
            });
        }

        // Category filter
        if (this.categoryFilter) {
            this.categoryFilter.addEventListener('change', (e) => {
                this.handleCategoryChange(e.target.value);
            });
        }

        // Clear filters button
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    async loadCategories() {
        try {
            const response = await window.userAPI.getCategories();
            if (response.success && response.data) {
                this.populateCategoryDropdown(response.data);
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    populateCategoryDropdown(categories) {
        if (!this.categoryFilter) return;

        // Clear existing options (except the first "All Categories" option)
        while (this.categoryFilter.children.length > 1) {
            this.categoryFilter.removeChild(this.categoryFilter.lastChild);
        }

        // Add category options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            this.categoryFilter.appendChild(option);
        });
    }

    handleSearchChange(value) {
        // Only trigger search if 2+ characters (as per requirements)
        if (value.length >= 2 || value.length === 0) {
            this.filters.search = value.trim();
            this.notifyFiltersChange();
        }
    }

    handleDateChange(value) {
        this.filters.date = value;
        this.notifyFiltersChange();
    }

    handleCategoryChange(value) {
        this.filters.category = value;
        this.notifyFiltersChange();
    }

    notifyFiltersChange() {
        if (this.onFiltersChange) {
            this.onFiltersChange({ ...this.filters });
        }
        
        // Emit custom event
        const event = new CustomEvent('filtersChange', {
            detail: { ...this.filters }
        });
        document.dispatchEvent(event);
    }

    clearAllFilters() {
        this.filters = {
            search: '',
            date: '',
            category: ''
        };

        // Reset UI elements
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        if (this.dateFilter) {
            this.dateFilter.value = '';
        }
        if (this.categoryFilter) {
            this.categoryFilter.value = '';
        }

        this.notifyFiltersChange();
    }

    setFilters(filters) {
        this.filters = { ...this.filters, ...filters };

        // Update UI elements
        if (filters.search !== undefined && this.searchInput) {
            this.searchInput.value = filters.search || '';
        }
        if (filters.date !== undefined && this.dateFilter) {
            this.dateFilter.value = filters.date || '';
        }
        if (filters.category !== undefined && this.categoryFilter) {
            this.categoryFilter.value = filters.category || '';
        }

        this.notifyFiltersChange();
    }

    getFilters() {
        return { ...this.filters };
    }

    hasActiveFilters() {
        return this.filters.search || this.filters.date || this.filters.category;
    }

    getActiveFiltersCount() {
        let count = 0;
        if (this.filters.search) count++;
        if (this.filters.date) count++;
        if (this.filters.category) count++;
        return count;
    }

    // Method to get filters formatted for API request
    getAPIParams() {
        const params = {};
        
        if (this.filters.search) {
            params.search = this.filters.search;
        }
        
        if (this.filters.date) {
            params.startDate = this.filters.date;
            params.endDate = this.filters.date; // For single date filter, use same date
        }
        
        if (this.filters.category) {
            params.category = this.filters.category;
        }
        
        return params;
    }

    // Method to validate filters
    validateFilters() {
        const errors = [];

        if (this.filters.search && this.filters.search.length < 2) {
            errors.push('Search must be at least 2 characters');
        }

        if (this.filters.date) {
            const date = new Date(this.filters.date);
            if (isNaN(date.getTime())) {
                errors.push('Invalid date format');
            }
        }

        return errors;
    }

    // Method to focus on first empty filter
    focusFirstEmptyFilter() {
        if (!this.filters.search && this.searchInput) {
            this.searchInput.focus();
            return true;
        }
        
        if (!this.filters.date && this.dateFilter) {
            this.dateFilter.focus();
            return true;
        }
        
        if (!this.filters.category && this.categoryFilter) {
            this.categoryFilter.focus();
            return true;
        }
        
        return false;
    }

    destroy() {
        // Clear event listeners
        if (this.searchInput) {
            this.searchInput.removeEventListener('input', this.handleSearchChange);
        }
        if (this.dateFilter) {
            this.dateFilter.removeEventListener('change', this.handleDateChange);
        }
        if (this.categoryFilter) {
            this.categoryFilter.removeEventListener('change', this.handleCategoryChange);
        }
        if (this.clearBtn) {
            this.clearBtn.removeEventListener('click', this.clearAllFilters);
        }

        // Clear debounce timer
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }

        this.onFiltersChange = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Filters;
}