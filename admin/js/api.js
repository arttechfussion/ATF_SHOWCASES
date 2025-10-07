/**
 * API Layer for Admin Panel
 * Handles all communication with Google Apps Script backend
 */
class AdminAPI {
    constructor() {
        this.baseUrl = null;
        this.token = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        await window.AppConfig.load();
        this.baseUrl = window.AppConfig.get('APP_SCRIPT_URL');
        this.token = sessionStorage.getItem('adminToken');
        
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

        // Add authorization header for secured endpoints
        if (this.token) {
            defaultOptions.headers['Authorization'] = `Bearer ${this.token}`;
        }

        const finalOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, finalOptions);
            
            if (response.status === 401) {
                // Token expired or invalid
                this.handleUnauthorized();
                throw new Error('Session expired. Please login again.');
            }
            
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

    // Authentication endpoints
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

    async logout() {
        try {
            return this.request('/auth/logout', {
                method: 'POST',
            });
        } finally {
            this.clearToken();
        }
    }

    // Categories endpoints
    async getCategories() {
        return this.request('/categories/list');
    }

    async createCategory(name) {
        return this.request('/categories/create', {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
    }

    async updateCategory(originalName, newName) {
        return this.request('/categories/update', {
            method: 'POST',
            body: JSON.stringify({ originalName, newName }),
        });
    }

    async deleteCategory(name) {
        return this.request('/categories/delete', {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
    }

    // Entries endpoints
    async getEntries(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/entries/list${queryString ? '?' + queryString : ''}`;
        return this.request(endpoint);
    }

    async createEntry(formData) {
        return this.request('/entries/create', {
            method: 'POST',
            body: formData,
            headers: {}, // Let browser set multipart/form-data headers
        });
    }

    async updateEntry(formData) {
        return this.request('/entries/update', {
            method: 'POST',
            body: formData,
            headers: {}, // Let browser set multipart/form-data headers
        });
    }

    async deleteEntry(sheetName, rowSerial, imageFileId) {
        return this.request('/entries/delete', {
            method: 'POST',
            body: JSON.stringify({ sheetName, rowSerial, imageFileId }),
        });
    }

    // Token management
    setToken(token) {
        this.token = token;
        sessionStorage.setItem('adminToken', token);
    }

    clearToken() {
        this.token = null;
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('tokenExpires');
    }

    getToken() {
        return this.token;
    }

    isAuthenticated() {
        return !!this.token && !this.isTokenExpired();
    }

    isTokenExpired() {
        const expiresAt = sessionStorage.getItem('tokenExpires');
        if (!expiresAt) return true;
        
        return new Date() > new Date(expiresAt);
    }

    handleUnauthorized() {
        this.clearToken();
        window.location.href = '../user/';
    }

    // File upload with progress
    uploadFile(file, onProgress) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);

            const xhr = new XMLHttpRequest();
            
            // Progress tracking
            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        onProgress(percentComplete);
                    }
                });
            }

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (error) {
                        reject(new Error('Invalid response from server'));
                    }
                } else {
                    reject(new Error(`Upload failed: ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error during upload'));
            });

            xhr.open('POST', `${this.baseUrl}/upload`);
            if (this.token) {
                xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
            }
            
            xhr.send(formData);
        });
    }

    // Utility methods
    formatParams(params) {
        const cleanParams = {};
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                cleanParams[key] = value;
            }
        }
        return cleanParams;
    }

    handleError(error, defaultMessage = 'An error occurred') {
        console.error('API Error:', error);
        
        if (error.message.includes('APP_SCRIPT_URL')) {
            return 'Backend not configured. Please contact administrator.';
        }
        
        if (error.message.includes('Failed to fetch')) {
            return 'Network error. Please check your connection.';
        }
        
        if (error.message.includes('Session expired')) {
            return 'Session expired. Please login again.';
        }
        
        return error.message || defaultMessage;
    }

    // Method to validate URL format
    validateUrl(url) {
        if (!url) return '';
        
        // Add https:// if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        try {
            new URL(url);
            return url;
        } catch (error) {
            throw new Error('Invalid URL format');
        }
    }
}

// Create global API instance
window.adminAPI = new AdminAPI();