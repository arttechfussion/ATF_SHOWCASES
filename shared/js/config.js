/**
 * Configuration Manager
 * Reads env/config.txt and provides configuration values
 */
class Config {
    constructor() {
        this.config = {};
        this.loaded = false;
    }

    async load() {
        if (this.loaded) return this.config;

        try {
            const response = await fetch('../env/config.txt');
            if (!response.ok) {
                throw new Error(`Failed to load config: ${response.status}`);
            }
            
            const text = await response.text();
            const lines = text.split('\n');
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const [key, ...valueParts] = trimmed.split('=');
                    if (key && valueParts.length > 0) {
                        this.config[key.trim()] = valueParts.join('=').trim();
                    }
                }
            }

            // Apply color tokens to CSS
            this.applyColorTokens();
            
            this.loaded = true;
            return this.config;
        } catch (error) {
            console.error('Error loading configuration:', error);
            // Fallback to defaults
            this.config = {
                APP_SCRIPT_URL: '',
                DRIVE_FOLDER_ID: '',
                PRIMARY_COLOR: '#0B5FFF',
                SECONDARY_COLOR: '#FFFFFF',
                BACKGROUND_COLOR: '#F8FAFC'
            };
            this.loaded = true;
            return this.config;
        }
    }

    applyColorTokens() {
        const root = document.documentElement;
        const colorMappings = {
            PRIMARY_COLOR: '--primary-color',
            SECONDARY_COLOR: '--secondary-color',
            BACKGROUND_COLOR: '--background-color',
            TEXT_PRIMARY: '--text-primary',
            TEXT_SECONDARY: '--text-secondary',
            BORDER_COLOR: '--border-color',
            SUCCESS_COLOR: '--success-color',
            ERROR_COLOR: '--error-color',
            WARNING_COLOR: '--warning-color'
        };

        for (const [configKey, cssVar] of Object.entries(colorMappings)) {
            if (this.config[configKey]) {
                root.style.setProperty(cssVar, this.config[configKey]);
            }
        }
    }

    get(key) {
        return this.config[key];
    }

    getAll() {
        return { ...this.config };
    }

    isLoaded() {
        return this.loaded;
    }
}

// Create global config instance
window.AppConfig = new Config();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
}