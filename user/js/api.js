/**
 * API Layer for User Showcase
 * Handles all communication with Google Apps Script backend
 */
class UserAPI {
    constructor() {
        this.baseUrl = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        await window.AppConfig.load();
        this.baseUrl = window.AppConfig.get('APP_SCRIPT_URL');
        
        if (!this.baseUrl) {
            console.warn('APP_SCRIPT_URL not configured');
        }
        
        this.initialized = true;
    }

    async request(endpoint, options = {}) {
        await this.init();
        
        if (!this.baseUrl) {
            throw new Error('API not configured. Please check your configuration.');
        }

        const url = `${this.baseUrl}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, finalOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Public endpoints
    async getPublicEntries(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/entries/publicList${queryString ? '?' + queryString : ''}`;
        return this.request(endpoint);
    }

    async getCategories() {
        return this.request('/categories/list');
    }

    // Auth endpoints
    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }

    async verifyToken(token) {
        return this.request('/auth/verify', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async logout(token) {
        return this.request('/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    // Utility method to format query parameters
    formatParams(params) {
        const cleanParams = {};
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                cleanParams[key] = value;
            }
        }
        return cleanParams;
    }

    // Method to handle API errors gracefully
    handleError(error, defaultMessage = 'An error occurred') {
        console.error('API Error:', error);
        
        if (error.message.includes('APP_SCRIPT_URL')) {
            return 'Backend not configured. Please contact administrator.';
        }
        
        if (error.message.includes('Failed to fetch')) {
            return 'Network error. Please check your connection.';
        }
        
        return error.message || defaultMessage;
    }
}

// Create global API instance
window.userAPI = new UserAPI();