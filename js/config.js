/**
 * Site Configuration Module
 * Loads and manages site configuration from JSON file
 */
class SiteConfig {
    constructor() {
        this.config = null;
        this.loaded = false;
    }

    async load() {
        try {
            const response = await fetch('config/site-config.json');
            this.config = await response.json();
            this.loaded = true;
            return this.config;
        } catch (error) {
            console.error('Failed to load site configuration:', error);
            throw error;
        }
    }

    get() {
        if (!this.loaded) {
            throw new Error('Configuration not loaded. Call load() first.');
        }
        return this.config;
    }

    getCategory(categoryId) {
        return this.config.categories.find(cat => cat.id === categoryId);
    }

    getAnalytics() {
        return this.config.analytics;
    }

    getPagination() {
        return this.config.pagination;
    }
}

// Export for use in other modules
window.SiteConfig = SiteConfig;
